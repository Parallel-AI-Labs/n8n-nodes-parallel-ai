import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from "n8n-workflow";

export class CalendarBookingTool implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Calendar Booking Tool",
    name: "calendarBookingTool",
    icon: "fa:calendar-check",
    group: ["transform"],
    version: 1,
    description: "Reserve a calendar meeting time - AI Tool for MCP Server",
    defaults: {
      name: "Calendar Booking Tool",
    },
    inputs: [],
    outputs: [NodeConnectionType.AiTool],
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const username = this.getNodeParameter("username", 0) as string;
    const toolDescription = this.getNodeParameter("toolDescription", 0) as string;

    if (!username) {
      throw new NodeOperationError(
        this.getNode(),
        "Username is required"
      );
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
      implementation: async (args: IDataObject) => {
        const email = args.email as string;
        const name = args.name as string;
        const start = args.start as string;
        const note = (args.note as string) || "";
        const eventId = args.eventId as string;

        if (!email || !name || !start || !eventId) {
          throw new NodeOperationError(
            this.getNode(),
            "email, name, start, and eventId are required"
          );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new NodeOperationError(
            this.getNode(),
            "Invalid email address format"
          );
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
          method: "POST" as "POST",
          uri: "https://hlpscbffug.execute-api.us-west-2.amazonaws.com/prod/schedule/reserve",
          body: bookingData,
          json: true,
        };

        try {
          const responseData = await this.helpers.request!(options);
          return responseData;
        } catch (error) {
          throw new NodeOperationError(
            this.getNode(),
            `Failed to book calendar meeting: ${error.message}`
          );
        }
      },
    };

    return [[{ json: toolDefinition }]];
  }
}