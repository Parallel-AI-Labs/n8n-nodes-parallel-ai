import {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeListSearchResult,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from "n8n-workflow";

// Response interface for browser task API
interface IBrowserTaskResponse extends IDataObject {
  success: boolean;
  result: string;
  history: string[];
  creditsCharged: number;
}

export class BrowserTask implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Parallel AI: Browser Task",
    name: "parallelAiBrowserTask",
    icon: "file:logo.png",
    group: ["transform"],
    version: 1,
    description:
      "Execute browser automation tasks using natural language instructions",
    defaults: {
      name: "Browser Task",
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
        displayName: "Task",
        name: "task",
        type: "string",
        default: "",
        required: true,
        description:
          "Natural language description of the browser task to perform (e.g., 'Navigate to example.com and extract the page title')",
        typeOptions: {
          alwaysOpenEditWindow: true,
          rows: 4,
        },
      },
      {
        displayName: "Session Type",
        name: "sessionType",
        type: "options",
        options: [
          {
            name: "Regular",
            value: "regular",
            description: "Use a standard browser session without authentication",
          },
          {
            name: "Authenticated",
            value: "authenticated",
            description: "Use an authenticated browser session from an integration",
          },
        ],
        default: "regular",
        description: "Type of browser session to use",
      },
      {
        displayName: "Browser Integration",
        name: "integrationId",
        type: "resourceLocator",
        default: { mode: "list", value: "" },
        required: true,
        description:
          "Browser integration to use for authenticated sessions (LinkedIn, Twitter, etc.)",
        displayOptions: {
          show: {
            sessionType: ["authenticated"],
          },
        },
        modes: [
          {
            displayName: "From List",
            name: "list",
            type: "list",
            typeOptions: {
              searchListMethod: "searchBrowserIntegrations",
              searchable: true,
            },
          },
          {
            displayName: "By ID",
            name: "id",
            type: "string",
            placeholder: "e.g. abc123",
          },
        ],
      },
    ],
  };

  methods = {
    listSearch: {
      async searchBrowserIntegrations(
        this: ILoadOptionsFunctions
      ): Promise<INodeListSearchResult> {
        const credentials = await this.getCredentials("parallelAiApi");
        const apiKey = credentials.apiKey as string;
        const baseUrl = credentials.baseUrl as string;

        try {
          const options = {
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            method: "GET" as "GET",
            uri: `${baseUrl}/api/v0/browser-integrations`,
            json: true,
          };

          const response = await this.helpers.request!(options);

          const results = response.integrations.map(
            (integration: IDataObject) => ({
              name: `${integration.name} (${integration.type})`,
              value: integration.id,
            })
          );

          return { results };
        } catch (error) {
          console.error("Error loading browser integrations:", error);
          return { results: [] };
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("parallelAiApi");
    const apiKey = credentials.apiKey as string;
    const baseUrl = credentials.baseUrl as string;

    // Get parameters
    const task = this.getNodeParameter("task", 0) as string;
    const sessionType = this.getNodeParameter("sessionType", 0) as string;

    // Handle resource locator for integration ID
    let integrationId: string | undefined = undefined;
    if (sessionType === "authenticated") {
      const integrationIdResource = this.getNodeParameter("integrationId", 0) as IDataObject;
      integrationId = integrationIdResource.value as string;
    }

    // Get inputs from connected nodes if available
    const items = this.getInputData();
    let effectiveTask = task;

    // If input contains a task, use that instead of the parameter
    if (items && items.length > 0) {
      const item = items[0];

      if (item.json && item.json.task) {
        effectiveTask = item.json.task as string;
      } else if (item.json && item.json.text) {
        effectiveTask = item.json.text as string;
      }
    }

    // Make sure we have a valid task
    if (!effectiveTask || effectiveTask.trim() === "") {
      throw new NodeOperationError(
        this.getNode(),
        "No task provided. Please provide a task as a parameter or input."
      );
    }

    // Prepare request body
    const requestBody: IDataObject = {
      task: effectiveTask,
      sessionType,
    };

    if (integrationId) {
      requestBody.integrationId = integrationId;
    }

    // Define the API request options
    const options = {
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      method: "POST" as "POST",
      uri: `${baseUrl}/api/v0/browser-task`,
      body: requestBody,
      json: true,
    };

    // Log the request details for debugging
    console.log(
      `Executing browser task: "${effectiveTask.substring(0, 50)}${
        effectiveTask.length > 50 ? "..." : ""
      }"`
    );
    console.log(`Session type: ${sessionType}`);
    if (integrationId) {
      console.log(`Integration ID: ${integrationId}`);
    }

    try {
      const responseData =
        (await this.helpers.request!(options)) as IBrowserTaskResponse;

      // Check if the task was successful
      if (!responseData.success) {
        throw new NodeOperationError(
          this.getNode(),
          `Browser task failed: ${responseData.result || "Unknown error"}`
        );
      }

      // Format output for n8n
      const output: IDataObject = {
        success: responseData.success,
        result: responseData.result,
        history: responseData.history || [],
        creditsCharged: responseData.creditsCharged,
        task: effectiveTask,
        sessionType,
      };

      if (integrationId) {
        output.integrationId = integrationId;
      }

      console.log(
        `Browser task completed successfully. Credits charged: ${responseData.creditsCharged}`
      );

      return [this.helpers.returnJsonArray(output)];
    } catch (error) {
      if (this.continueOnFail()) {
        const executionErrorData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray({ error: error.message }),
          { itemData: { item: 0 } }
        );
        return [[...executionErrorData]];
      }
      throw error;
    }
  }
}
