import {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from "n8n-workflow";

/**
 * Live OpenAPI catalog for the Parallel AI API node.
 *
 * The node has no build-time knowledge of the API surface: the spec is
 * fetched from `<baseUrl>/docs/openapi.json` whenever resources, operations,
 * or parameters are needed (editor dropdowns, parameter fields, execution)
 * and parsed into this catalog, so the node always reflects the current API.
 * A short-lived in-memory cache avoids refetching on every dropdown render.
 */

export type ParamKind = "string" | "number" | "boolean" | "json";
export type ParamLocation = "path" | "query" | "body";

export interface OperationParam {
  /** Unique field id within the operation (body fields that shadow a path/query param are prefixed). */
  id: string;
  /** Name of the parameter as the API expects it. */
  apiName: string;
  location: ParamLocation;
  kind: ParamKind;
  required: boolean;
  description: string;
  enumOptions?: INodePropertyOptions[];
}

export interface OperationDef {
  value: string;
  displayName: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  params: OperationParam[];
}

export interface ResourceDef {
  value: string;
  name: string;
  operations: OperationDef[];
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedCatalog: { baseUrl: string; fetchedAt: number; resources: ResourceDef[] } | undefined;

const camelize = (str: string): string =>
  str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, c: string) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

export const titleize = (camel: string): string =>
  camel
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const firstLine = (text: unknown): string =>
  typeof text === "string" ? text.split("\n")[0].trim() : "";

function mapKind(schema: IDataObject): { kind: ParamKind; enumOptions?: INodePropertyOptions[] } {
  const type = schema.type as string | undefined;
  if (type === "boolean") return { kind: "boolean" };
  if (type === "integer" || type === "number") return { kind: "number" };
  if (type === "object" || type === "array") return { kind: "json" };
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return {
      kind: "string",
      enumOptions: (schema.enum as string[]).map((v) => ({
        name: titleize(camelize(String(v))),
        value: v,
      })),
    };
  }
  return { kind: "string" };
}

function parseSpec(spec: IDataObject): ResourceDef[] {
  const resources = new Map<string, ResourceDef>();
  const paths = (spec.paths ?? {}) as Record<string, Record<string, IDataObject>>;

  for (const [rawPath, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method)) continue;

      const tags = op.tags as string[] | undefined;
      const tag = (tags && tags[0]) || "Other";
      const resourceValue = camelize(tag);
      if (!resources.has(resourceValue)) {
        resources.set(resourceValue, { value: resourceValue, name: tag, operations: [] });
      }
      const resource = resources.get(resourceValue) as ResourceDef;

      // e.g. employees_chatEmployee -> chatEmployee
      const opId = String(op.operationId ?? `${method}_${rawPath}`);
      let opValue = camelize(opId.includes("_") ? opId.split("_").slice(1).join("_") : opId);
      if (resource.operations.some((o) => o.value === opValue)) {
        opValue = `${opValue}${method.charAt(0).toUpperCase()}${method.slice(1)}`;
      }

      const params: OperationParam[] = [];
      const taken = new Set<string>();

      for (const prm of (op.parameters as IDataObject[] | undefined) ?? []) {
        const location = prm.in as string;
        if (location !== "path" && location !== "query") continue;
        const schema = (prm.schema ?? {}) as IDataObject;
        const { kind, enumOptions } = mapKind(schema);
        const name = String(prm.name);
        taken.add(name);
        params.push({
          id: name,
          apiName: name,
          location,
          kind,
          required: location === "path" ? true : !!prm.required,
          description: firstLine(prm.description),
          enumOptions,
        });
      }

      const requestBody = op.requestBody as IDataObject | undefined;
      const content = requestBody?.content as IDataObject | undefined;
      const jsonContent = content?.["application/json"] as IDataObject | undefined;
      const bodySchema = jsonContent?.schema as IDataObject | undefined;
      if (bodySchema?.properties) {
        const requiredSet = new Set((bodySchema.required as string[] | undefined) ?? []);
        for (const [propName, propSchemaRaw] of Object.entries(
          bodySchema.properties as Record<string, IDataObject>
        )) {
          const { kind, enumOptions } = mapKind(propSchemaRaw);
          params.push({
            id: taken.has(propName) ? `body_${propName}` : propName,
            apiName: propName,
            location: "body",
            kind,
            required: requiredSet.has(propName),
            description: firstLine(propSchemaRaw.description),
            enumOptions,
          });
        }
      }

      resource.operations.push({
        value: opValue,
        displayName: titleize(opValue),
        description: firstLine(op.description),
        method: method.toUpperCase() as OperationDef["method"],
        path: rawPath,
        params,
      });
    }
  }

  const sorted = [...resources.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const resource of sorted) {
    resource.operations.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  return sorted;
}

export async function getCatalog(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  baseUrl: string
): Promise<ResourceDef[]> {
  if (
    cachedCatalog &&
    cachedCatalog.baseUrl === baseUrl &&
    Date.now() - cachedCatalog.fetchedAt < CACHE_TTL_MS
  ) {
    return cachedCatalog.resources;
  }

  // The spec endpoint is public: no credentials are involved in this request.
  const spec = (await context.helpers.httpRequest({
    method: "GET",
    url: `${baseUrl}/docs/openapi.json`,
    json: true,
  })) as IDataObject;

  const resources = parseSpec(spec);
  cachedCatalog = { baseUrl, fetchedAt: Date.now(), resources };
  return resources;
}

export async function getCatalogBaseUrl(
  context: IExecuteFunctions | ILoadOptionsFunctions
): Promise<string> {
  const credentials = await context.getCredentials("parallelAiApi");
  return ((credentials.baseUrl as string) || "https://api.parallellabs.app").replace(/\/$/, "");
}

export function findOperation(
  resources: ResourceDef[],
  resourceValue: string,
  operationValue: string
): OperationDef | undefined {
  const resource = resources.find((r) => r.value === resourceValue);
  return resource?.operations.find((o) => o.value === operationValue);
}
