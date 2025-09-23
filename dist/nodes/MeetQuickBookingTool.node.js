"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarBookingTool = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CalendarBookingTool {
    constructor() {
        this.description = {
            displayName: "MeetQuick Booking Tool",
            name: "meetQuickBookingTool",
            icon: "file:meetquick.png",
            group: ["transform"],
            version: 1,
            description: "Reserve a MeetQuick meeting - AI Tool for MCP Server",
            defaults: {
                name: "MeetQuick Booking Tool",
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
                    description: "Calendar username to book meeting for",
                },
                {
                    displayName: "Tool Description",
                    name: "toolDescription",
                    type: "string",
                    typeOptions: {
                        alwaysOpenEditWindow: true,
                    },
                    default: "Reserve a calendar meeting time. Use event.id as the eventId field from the calendar availability tool. Requires email, name, start time, note, and eventId.",
                    description: "Description of what this tool does for the AI",
                },
            ],
        };
    }
    async execute() {
        const username = this.getNodeParameter("username", 0);
        const toolDescription = this.getNodeParameter("toolDescription", 0);
        if (!username) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Username is required");
        }
        const toolDefinition = {
            type: "function",
            function: {
                name: "book_calendar_meeting",
                description: toolDescription,
                parameters: {
                    type: "object",
                    properties: {
                        email: {
                            type: "string",
                            description: "Email address of the person booking the meeting",
                            format: "email",
                        },
                        name: {
                            type: "string",
                            description: "Name of the person booking the meeting",
                        },
                        start: {
                            type: "string",
                            description: "Meeting start time in ISO format",
                        },
                        note: {
                            type: "string",
                            description: "Additional notes for the meeting",
                        },
                        eventId: {
                            type: "string",
                            description: "Event ID from the calendar availability tool (use event.id field)",
                        },
                    },
                    required: ["email", "name", "start", "eventId"],
                },
            },
            implementation: async (args) => {
                const email = args.email;
                const name = args.name;
                const start = args.start;
                const note = args.note || "";
                const eventId = args.eventId;
                if (!email || !name || !start || !eventId) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), "email, name, start, and eventId are required");
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Invalid email address format");
                }
                const bookingData = {
                    email,
                    username,
                    start,
                    name,
                    note,
                    id: eventId,
                };
                const options = {
                    method: "POST",
                    uri: "https://hlpscbffug.execute-api.us-west-2.amazonaws.com/prod/schedule/reserve",
                    body: bookingData,
                    json: true,
                };
                try {
                    const responseData = await this.helpers.request(options);
                    return responseData;
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to book calendar meeting: ${error.message}`);
                }
            },
        };
        return [[{ json: toolDefinition }]];
    }
}
exports.CalendarBookingTool = CalendarBookingTool;
//# sourceMappingURL=MeetQuickBookingTool.node.js.map