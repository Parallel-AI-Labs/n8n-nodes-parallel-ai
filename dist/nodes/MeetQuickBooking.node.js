"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarBooking = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CalendarBooking {
    constructor() {
        this.description = {
            displayName: "MeetQuick Booking",
            name: "meetQuickBooking",
            icon: "file:meetquick.png",
            group: ["transform"],
            version: 1,
            description: "Reserve a MeetQuick meeting time",
            defaults: {
                name: "MeetQuick Booking",
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
                    description: "Calendar username to book meeting for",
                },
                {
                    displayName: "Event ID",
                    name: "eventId",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Event ID from calendar availability (event.id field)",
                },
                {
                    displayName: "Attendee Email",
                    name: "email",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Email address of the person booking the meeting",
                },
                {
                    displayName: "Attendee Name",
                    name: "name",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Name of the person booking the meeting",
                },
                {
                    displayName: "Meeting Start Time",
                    name: "start",
                    type: "string",
                    default: "",
                    required: true,
                    description: "Meeting start time (ISO format)",
                    placeholder: "2025-09-23T10:00:00Z",
                },
                {
                    displayName: "Note",
                    name: "note",
                    type: "string",
                    typeOptions: {
                        alwaysOpenEditWindow: true,
                    },
                    default: "",
                    description: "Additional notes for the meeting",
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const username = this.getNodeParameter("username", i);
            const eventId = this.getNodeParameter("eventId", i);
            const email = this.getNodeParameter("email", i);
            const name = this.getNodeParameter("name", i);
            const start = this.getNodeParameter("start", i);
            const note = this.getNodeParameter("note", i, "");
            if (!username || !eventId || !email || !name || !start) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), "Username, event ID, email, name, and start time are required");
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
exports.CalendarBooking = CalendarBooking;
//# sourceMappingURL=MeetQuickBooking.node.js.map