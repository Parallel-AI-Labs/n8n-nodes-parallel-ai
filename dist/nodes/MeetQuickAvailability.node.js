"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetQuickAvailability = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MeetQuickAvailability {
    constructor() {
        this.description = {
            displayName: "MeetQuick Availability",
            name: "meetQuickAvailability",
            icon: "file:meetquick.png",
            group: ["transform"],
            version: 1,
            description: "Get available MeetQuick calendar times for scheduling meetings",
            defaults: {
                name: "MeetQuick Availability",
            },
            inputs: ["main"],
            outputs: ["main"],
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
                    displayName: "Start Date",
                    name: "startDate",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Start date in YYYY-MM-DD format",
                    placeholder: "2025-09-23",
                },
                {
                    displayName: "End Date",
                    name: "endDate",
                    type: "string",
                    default: "",
                    required: true,
                    description: "End date in YYYY-MM-DD format",
                    placeholder: "2025-09-30",
                },
                {
                    displayName: "Timezone Offset",
                    name: "timezoneOffset",
                    type: "number",
                    default: -420,
                    description: "Timezone offset in minutes (e.g., -420 for PST/PDT)",
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const username = this.getNodeParameter("username", i);
            const eventName = this.getNodeParameter("eventName", i);
            const startDate = this.getNodeParameter("startDate", i);
            const endDate = this.getNodeParameter("endDate", i);
            const timezoneOffset = this.getNodeParameter("timezoneOffset", i);
            if (!username || !eventName || !startDate || !endDate) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Username, event name, start date, and end date are required");
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
                returnData.push({
                    json: responseData,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: i },
                    });
                }
                else {
                    throw error;
                }
            }
        }
        return [returnData];
    }
}
exports.MeetQuickAvailability = MeetQuickAvailability;
//# sourceMappingURL=MeetQuickAvailability.node.js.map