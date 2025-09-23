"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarAvailabilityTool = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CalendarAvailabilityTool {
    constructor() {
        this.description = {
            displayName: "MeetQuick Availability Tool",
            name: "meetQuickAvailabilityTool",
            icon: "file:meetquick.png",
            group: ["transform"],
            version: 1,
            description: "Get available MeetQuick times - AI Tool for MCP Server",
            defaults: {
                name: "MeetQuick Availability Tool",
            },
            inputs: [],
            outputs: ["ai_tool"],
            usableAsTool: true,
            properties: [
                {
                    displayName: "Username",
                    name: "username",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Calendar username to check availability for",
                },
                {
                    displayName: "Event Name",
                    name: "eventName",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Name of the calendar event type (e.g., 30-min-chat)",
                },
                {
                    displayName: "Timezone Offset",
                    name: "timezoneOffset",
                    type: "number",
                    default: -420,
                    description: "Timezone offset in minutes (e.g., -420 for PST/PDT)",
                },
                {
                    displayName: "Tool Description",
                    name: "toolDescription",
                    type: "string",
                    typeOptions: {
                        alwaysOpenEditWindow: true,
                    },
                    default: "Get available calendar times using date format YYYY-MM-DD. Requires startDate and endDate parameters.",
                    description: "Description of what this tool does for the AI",
                },
            ],
        };
    }
    async execute() {
        const username = this.getNodeParameter("username", 0);
        const eventName = this.getNodeParameter("eventName", 0);
        const timezoneOffset = this.getNodeParameter("timezoneOffset", 0);
        const toolDescription = this.getNodeParameter("toolDescription", 0);
        if (!username || !eventName) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Username and event name are required");
        }
        const toolDefinition = {
            type: "function",
            function: {
                name: "get_calendar_availability",
                description: toolDescription,
                parameters: {
                    type: "object",
                    properties: {
                        startDate: {
                            type: "string",
                            description: "Start date in YYYY-MM-DD format",
                            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                        },
                        endDate: {
                            type: "string",
                            description: "End date in YYYY-MM-DD format",
                            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                        },
                    },
                    required: ["startDate", "endDate"],
                },
            },
            implementation: async (args) => {
                const startDate = args.startDate;
                const endDate = args.endDate;
                if (!startDate || !endDate) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), "startDate and endDate are required");
                }
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Dates must be in YYYY-MM-DD format");
                }
                const url = `https://hlpscbffug.execute-api.us-west-2.amazonaws.com/prod/available/times?username=${encodeURIComponent(username)}&link=${encodeURIComponent(eventName)}&startDate=${startDate}&endDate=${endDate}&offset=${timezoneOffset}`;
                const options = {
                    method: "GET",
                    uri: url,
                    json: true,
                };
                try {
                    const responseData = await this.helpers.request(options);
                    return responseData;
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to fetch calendar availability: ${error.message}`);
                }
            },
        };
        return [[{ json: toolDefinition }]];
    }
}
exports.CalendarAvailabilityTool = CalendarAvailabilityTool;
//# sourceMappingURL=MeetQuickAvailabilityTool.node.js.map