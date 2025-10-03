"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserTask = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class BrowserTask {
    constructor() {
        this.description = {
            displayName: "Parallel AI: Browser Task",
            name: "parallelAiBrowserTask",
            icon: "file:logo.png",
            group: ["transform"],
            version: 1,
            description: "Execute browser automation tasks using natural language instructions",
            defaults: {
                name: "Browser Task",
            },
            inputs: ["main"],
            outputs: ["main"],
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
                    description: "Natural language description of the browser task to perform (e.g., 'Navigate to example.com and extract the page title')",
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
                    description: "Browser integration to use for authenticated sessions (LinkedIn, Twitter, etc.)",
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
        this.methods = {
            listSearch: {
                async searchBrowserIntegrations() {
                    const credentials = await this.getCredentials("parallelAiApi");
                    const apiKey = credentials.apiKey;
                    const baseUrl = credentials.baseUrl;
                    try {
                        const options = {
                            headers: {
                                "X-API-KEY": apiKey,
                                "Content-Type": "application/json",
                            },
                            method: "GET",
                            uri: `${baseUrl}/api/v0/browser-integrations`,
                            json: true,
                        };
                        const response = await this.helpers.request(options);
                        const results = response.integrations.map((integration) => ({
                            name: `${integration.name} (${integration.type})`,
                            value: integration.id,
                        }));
                        return { results };
                    }
                    catch (error) {
                        console.error("Error loading browser integrations:", error);
                        return { results: [] };
                    }
                },
            },
        };
    }
    async execute() {
        const credentials = await this.getCredentials("parallelAiApi");
        const apiKey = credentials.apiKey;
        const baseUrl = credentials.baseUrl;
        const task = this.getNodeParameter("task", 0);
        const sessionType = this.getNodeParameter("sessionType", 0);
        let integrationId = undefined;
        if (sessionType === "authenticated") {
            const integrationIdResource = this.getNodeParameter("integrationId", 0);
            integrationId = integrationIdResource.value;
        }
        const items = this.getInputData();
        let effectiveTask = task;
        if (items && items.length > 0) {
            const item = items[0];
            if (item.json && item.json.task) {
                effectiveTask = item.json.task;
            }
            else if (item.json && item.json.text) {
                effectiveTask = item.json.text;
            }
        }
        if (!effectiveTask || effectiveTask.trim() === "") {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), "No task provided. Please provide a task as a parameter or input.");
        }
        const requestBody = {
            task: effectiveTask,
            sessionType,
        };
        if (integrationId) {
            requestBody.integrationId = integrationId;
        }
        const options = {
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
            method: "POST",
            uri: `${baseUrl}/api/v0/browser-task`,
            body: requestBody,
            json: true,
        };
        console.log(`Executing browser task: "${effectiveTask.substring(0, 50)}${effectiveTask.length > 50 ? "..." : ""}"`);
        console.log(`Session type: ${sessionType}`);
        if (integrationId) {
            console.log(`Integration ID: ${integrationId}`);
        }
        try {
            const responseData = (await this.helpers.request(options));
            if (!responseData.success) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Browser task failed: ${responseData.result || "Unknown error"}`);
            }
            const output = {
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
            console.log(`Browser task completed successfully. Credits charged: ${responseData.creditsCharged}`);
            return [this.helpers.returnJsonArray(output)];
        }
        catch (error) {
            if (this.continueOnFail()) {
                const executionErrorData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray({ error: error.message }), { itemData: { item: 0 } });
                return [[...executionErrorData]];
            }
            throw error;
        }
    }
}
exports.BrowserTask = BrowserTask;
//# sourceMappingURL=BrowserTask.node.js.map