import {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  JsonObject,
  NodeApiError,
  NodeConnectionType,
  NodeOperationError,
  ResourceMapperField,
  ResourceMapperFields,
  ResourceMapperValue,
  jsonParse,
} from "n8n-workflow";

import {
  OperationParam,
  findOperation,
  getCatalog,
  getCatalogBaseUrl,
} from "./SpecCatalog";

/**
 * Converts a resource-mapper value for one parameter into what the API
 * expects, returning undefined when an optional parameter was left unset so
 * it is omitted from the request entirely.
 */
function coerceParamValue(param: OperationParam, raw: unknown): unknown {
  if (raw === undefined || raw === null) return undefined;

  if (param.kind === "json") {
    if (typeof raw === "string") {
      if (raw.trim() === "") return undefined;
      return jsonParse<IDataObject | IDataObject[]>(raw);
    }
    return raw;
  }

  if (!param.required && param.kind === "string" && raw === "") return undefined;

  return raw;
}

/**
 * Spec-driven Parallel AI node. The API surface is not baked into the
 * package: resources, operations, and parameter fields are read live from
 * the platform's OpenAPI spec (see SpecCatalog), the same way the platform
 * MCP exposes the API, so the node is always in sync with the current API.
 */
export class ParallelAiApi implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Parallel AI API",
    name: "parallelAiApi",
    icon: "file:icon.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: "Call any Parallel AI platform API operation",
    defaults: {
      name: "Parallel AI API",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    usableAsTool: true,
    credentials: [
      {
        name: "parallelAiApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource Name or ID",
        name: "resource",
        type: "options",
        noDataExpression: true,
        typeOptions: {
          loadOptionsMethod: "getResources",
        },
        default: "",
        required: true,
        description:
          'API category to work with, loaded live from the API spec. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: "Operation Name or ID",
        name: "operation",
        type: "options",
        noDataExpression: true,
        typeOptions: {
          loadOptionsMethod: "getOperations",
          loadOptionsDependsOn: ["resource"],
        },
        default: "",
        required: true,
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
      },
      {
        displayName: "Parameters",
        name: "parameters",
        type: "resourceMapper",
        noDataExpression: true,
        default: {
          mappingMode: "defineBelow",
          value: null,
        },
        required: true,
        typeOptions: {
          loadOptionsDependsOn: ["resource", "operation"],
          resourceMapper: {
            resourceMapperMethod: "getOperationParameters",
            mode: "add",
            fieldWords: {
              singular: "parameter",
              plural: "parameters",
            },
            addAllFields: true,
            supportAutoMap: false,
          },
        },
      },
    ],
  };

  methods = {
    loadOptions: {
      async getResources(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const baseUrl = await getCatalogBaseUrl(this);
        const resources = await getCatalog(this, baseUrl);
        return resources.map((resource) => ({
          name: resource.name,
          value: resource.value,
          description: `${resource.operations.length} operations`,
        }));
      },

      async getOperations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const resourceValue = this.getCurrentNodeParameter("resource") as string;
        if (!resourceValue) return [];
        const baseUrl = await getCatalogBaseUrl(this);
        const resources = await getCatalog(this, baseUrl);
        const resource = resources.find((r) => r.value === resourceValue);
        if (!resource) return [];
        return resource.operations.map((op) => ({
          name: op.displayName,
          value: op.value,
          description: op.description || `${op.method} ${op.path}`,
        }));
      },
    },

    resourceMapping: {
      async getOperationParameters(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
        const resourceValue = this.getCurrentNodeParameter("resource") as string;
        const operationValue = this.getCurrentNodeParameter("operation") as string;
        if (!resourceValue || !operationValue) return { fields: [] };

        const baseUrl = await getCatalogBaseUrl(this);
        const resources = await getCatalog(this, baseUrl);
        const operation = findOperation(resources, resourceValue, operationValue);
        if (!operation) return { fields: [] };

        const fields: ResourceMapperField[] = operation.params.map((param) => ({
          id: param.id,
          displayName: param.description
            ? `${param.apiName} — ${param.description}`
            : param.apiName,
          required: param.required,
          defaultMatch: false,
          display: true,
          type:
            param.enumOptions !== undefined
              ? "options"
              : param.kind === "json"
                ? "object"
                : param.kind,
          options: param.enumOptions,
          canBeUsedToMatch: false,
        }));

        return {
          fields,
          emptyFieldsNotice: "This operation takes no parameters.",
        };
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const baseUrl = await getCatalogBaseUrl(this);
    const resources = await getCatalog(this, baseUrl);

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter("resource", i) as string;
        const operationValue = this.getNodeParameter("operation", i) as string;
        const operation = findOperation(resources, resource, operationValue);

        if (!operation) {
          throw new NodeOperationError(
            this.getNode(),
            `Operation "${operationValue}" was not found for resource "${resource}" in the current API spec`,
            { itemIndex: i }
          );
        }

        const mapperValue = this.getNodeParameter("parameters", i, {}) as ResourceMapperValue;
        const rawValues = (mapperValue?.value ?? {}) as IDataObject;

        let path = operation.path;
        const qs: IDataObject = {};
        const body: IDataObject = {};

        for (const param of operation.params) {
          const value = coerceParamValue(param, rawValues[param.id]);
          if (value === undefined) {
            if (param.required && param.location === "path") {
              throw new NodeOperationError(
                this.getNode(),
                `Missing required parameter "${param.apiName}"`,
                { itemIndex: i }
              );
            }
            continue;
          }
          if (param.location === "path") {
            path = path.replace(`{${param.apiName}}`, encodeURIComponent(String(value)));
          } else if (param.location === "query") {
            qs[param.apiName] = value as IDataObject[keyof IDataObject];
          } else {
            body[param.apiName] = value as IDataObject[keyof IDataObject];
          }
        }

        const options: IHttpRequestOptions = {
          method: operation.method,
          url: `${baseUrl}${path}`,
          json: true,
        };
        if (Object.keys(qs).length > 0) options.qs = qs;
        if (Object.keys(body).length > 0) options.body = body;

        const responseData = await this.helpers.httpRequestWithAuthentication.call(
          this,
          "parallelAiApi",
          options
        );

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData as IDataObject | IDataObject[]),
          { itemData: { item: i } }
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          const executionErrorData = this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray({ error: (error as Error).message }),
            { itemData: { item: i } }
          );
          returnData.push(...executionErrorData);
          continue;
        }
        if (error instanceof NodeOperationError) {
          throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
        }
        throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
