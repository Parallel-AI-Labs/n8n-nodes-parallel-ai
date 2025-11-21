import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from "n8n-workflow";
import { createReadStream } from "fs";

export class ParallelAi implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Parallel AI",
    name: "parallelAi",
    icon: "file:logo.png",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: "Interact with Parallel AI",
    defaults: {
      name: "Parallel AI",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main, NodeConnectionType.AiTool],
    outputNames: ["Standard Output", "AI Tool Output"],
    usableAsTool: true,
    credentials: [
      {
        name: "parallelAiApi",
        required: true,
      },
    ],
    properties: [
      // Resource selection
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Employee",
            value: "employee",
          },
          {
            name: "Image",
            value: "image",
          },
          {
            name: "List",
            value: "list",
          },
          {
            name: "Document",
            value: "document",
          },
          {
            name: "Folder",
            value: "folder",
          },
          {
            name: "Sequence",
            value: "sequence",
          },
          {
            name: "System",
            value: "system",
          },
        ],
        default: "employee",
        required: true,
      },

      // EMPLOYEE OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["employee"],
          },
        },
        options: [
          {
            name: "Chat",
            value: "chat",
            action: "Chat with an employee",
            description: "Send a message to an employee and get a response",
          },
          {
            name: "Get All",
            value: "getAll",
            action: "Get all employees",
            description: "Retrieve a list of all employees",
          },
        ],
        default: "chat",
      },

      // LIST OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["list"],
          },
        },
        options: [
          {
            name: "Add Column",
            value: "addColumn",
            action: "Add a column to a list",
            description: "Add a new column to an existing list",
          },
          {
            name: "Add Rows",
            value: "addRows",
            action: "Add rows to a list",
            description: "Add one or more rows to a list",
          },
          {
            name: "Create",
            value: "create",
            action: "Create a new list",
            description: "Create a new list",
          },
          {
            name: "Get",
            value: "get",
            action: "Get a list",
            description: "Get a specific list by ID",
          },
          {
            name: "Get All",
            value: "getAll",
            action: "Get all lists",
            description: "Get all available lists",
          },
          {
            name: "Update Rows",
            value: "updateRows",
            action: "Update rows in a list",
            description: "Update existing rows in a list",
          },
        ],
        default: "getAll",
      },

      // DOCUMENT OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["document"],
          },
        },
        options: [
          {
            name: "Create",
            value: "create",
            action: "Create a document",
            description: "Create a new document",
          },
          {
            name: "Delete",
            value: "delete",
            action: "Delete a document",
            description: "Delete a document by ID",
          },
          {
            name: "Get",
            value: "get",
            action: "Get a document",
            description: "Get a document by ID",
          },
          {
            name: "Get All",
            value: "getAll",
            action: "Get all documents",
            description: "Get all documents in a specific path",
          },
          {
            name: "Move",
            value: "move",
            action: "Move a document",
            description: "Move a document to a different folder",
          },
          {
            name: "Update",
            value: "update",
            action: "Update a document",
            description: "Update an existing document",
          },
          {
            name: "Search",
            value: "search",
            action: "Search documents",
            description: "Search for documents matching a text query",
          },
        ],
        default: "getAll",
      },

      // FOLDER OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["folder"],
          },
        },
        options: [
          {
            name: "Create",
            value: "create",
            action: "Create a folder",
            description: "Create a new folder",
          },
          {
            name: "Delete",
            value: "delete",
            action: "Delete a folder",
            description: "Delete a folder",
          },
          {
            name: "Get All",
            value: "getAll",
            action: "Get all folders",
            description: "Get all folders",
          },
        ],
        default: "getAll",
      },

      // SEQUENCE OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["sequence"],
          },
        },
        options: [
          {
            name: "Add Member",
            value: "addMember",
            action: "Add a member to a sequence",
            description: "Add a new member to a sequence",
          },
          {
            name: "Get All",
            value: "getAll",
            action: "Get all sequences",
            description: "Get all available sequences",
          },
          {
            name: "Get Members",
            value: "getMembers",
            action: "Get sequence members",
            description: "Get all members of a sequence",
          },
          {
            name: "Remove Member",
            value: "removeMember",
            action: "Remove a member from a sequence",
            description: "Remove a member from a sequence",
          },
          {
            name: "Trigger Member",
            value: "triggerMember",
            action: "Trigger a sequence member",
            description: "Trigger the next step for a sequence member",
          },
        ],
        default: "getAll",
      },

      // IMAGE OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["image"],
          },
        },
        options: [
          {
            name: "Generate",
            value: "generate",
            action: "Generate an image",
            description: "Create an AI-generated image",
          },
          {
            name: "Get Models",
            value: "getModels",
            action: "Get available image models",
            description: "Get a list of available image generation models",
          },
        ],
        default: "generate",
      },

      // SYSTEM OPERATIONS
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["system"],
          },
        },
        options: [
          {
            name: "Get Models",
            value: "getModels",
            action: "Get available models",
            description: "Get a list of available AI models",
          },
          {
            name: "Get Settings",
            value: "getSettings",
            action: "Get settings",
            description: "Get user settings",
          },
        ],
        default: "getModels",
      },

      // EMPLOYEE CHAT PARAMETERS
      {
        displayName: "Employee",
        name: "employeeId",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getEmployees",
        },
        required: true,
        default: "",
        description: "Employee to chat with",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Message",
        name: "message",
        type: "string",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "",
        required: true,
        description: "Message to send to the employee",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Model",
        name: "model",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getModels",
        },
        default: "gpt-4.1-nano-2025-04-14",
        description: "AI model to use for the conversation",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Knowledge Sources",
        name: "knowledgeSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Knowledge Base",
        name: "documents",
        type: "boolean",
        default: true,
        description: "Access company knowledge base for information",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Search Engine",
        name: "searchEngine",
        type: "boolean",
        default: false,
        description: "Allow searching the web for information",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Websites",
        name: "websites",
        type: "boolean",
        default: false,
        description: "Allow accessing and reading websites",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use News",
        name: "news",
        type: "boolean",
        default: false,
        description: "Allow searching news for recent information",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Memory Settings",
        name: "memorySection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Short-Term Memory",
        name: "shortTermMemories",
        type: "boolean",
        default: true,
        description: "Recall information from the current conversation",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Long-Term Memory",
        name: "longTermMemories",
        type: "boolean",
        default: false,
        description: "Access information from past conversations",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Memory Scope",
        name: "memoryScope",
        type: "options",
        options: [
          {
            name: "Current Chat",
            value: "chat",
          },
          {
            name: "Company-wide",
            value: "company",
          },
        ],
        default: "chat",
        description: "Scope of memory to access for the conversation",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
            longTermMemories: [true],
          },
        },
      },
      {
        displayName: "Context Types",
        name: "contextSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Company Context",
        name: "company",
        type: "boolean",
        default: true,
        description: "Include company information in responses",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Use Employee Persona",
        name: "employee",
        type: "boolean",
        default: true,
        description: "Maintain the employee's persona in responses",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Tools",
        name: "toolsSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Smart List Management",
        name: "lists",
        type: "boolean",
        default: false,
        description: "AI can create, manage, and update Smart Lists on the platform",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Research Task",
        name: "researchTask",
        type: "boolean",
        default: false,
        description: "AI can delegate complex research tasks to a specialized research agent for comprehensive, real-time information gathering",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Create Documents",
        name: "documentCreation",
        type: "boolean",
        default: false,
        description: "AI can generate PDF, DOCX, or CSV files and email them to you",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Enable Browser Tasks",
        name: "browserTaskEnabled",
        type: "boolean",
        default: false,
        description: "Allow the AI to control a web browser for automation tasks",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Browser Session Type",
        name: "browserSessionType",
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
          {
            name: "Residential Proxy",
            value: "residential",
            description: "Use a residential proxy with US zipcode targeting",
          },
        ],
        default: "regular",
        description: "Type of browser session to use",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
            browserTaskEnabled: [true],
          },
        },
      },
      {
        displayName: "Browser Integration",
        name: "browserIntegrationId",
        type: "options",
        default: "",
        required: true,
        description: "Browser integration to use for authenticated sessions (LinkedIn, Twitter, etc.)",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
            browserTaskEnabled: [true],
            browserSessionType: ["authenticated"],
          },
        },
        typeOptions: {
          loadOptionsMethod: "getBrowserIntegrations",
        },
        options: [],
      },
      {
        displayName: "Zipcode",
        name: "browserZipcode",
        type: "string",
        default: "",
        required: true,
        placeholder: "e.g. 94102",
        description: "5-digit US zipcode for residential proxy targeting",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
            browserTaskEnabled: [true],
            browserSessionType: ["residential"],
          },
        },
      },
      {
        displayName: "Advanced Settings",
        name: "advancedSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },
      {
        displayName: "Temperature",
        name: "temperature",
        type: "number",
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 1,
        },
        default: 0.7,
        description: "Controls randomness (0 = deterministic, 1 = creative)",
        displayOptions: {
          show: {
            resource: ["employee"],
            operation: ["chat"],
          },
        },
      },

      // LIST PARAMETERS
      // LIST: GET ALL parameters
      {
        displayName: "Pagination",
        name: "paginationSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["getAll"],
          },
        },
      },
      {
        displayName: "Page",
        name: "page",
        type: "number",
        default: 1,
        description: "Page number to retrieve",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["getAll"],
          },
        },
      },
      {
        displayName: "Page Size",
        name: "pageSize",
        type: "number",
        default: 20,
        description: "Number of lists per page",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["getAll"],
          },
        },
      },

      // LIST: GET parameters
      {
        displayName: "List ID",
        name: "listId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the list to retrieve",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["get", "addColumn", "addRows", "updateRows"],
          },
        },
      },
      {
        displayName: "Page",
        name: "page",
        type: "number",
        default: 1,
        description: "Page number to retrieve",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["get"],
          },
        },
      },
      {
        displayName: "Page Size",
        name: "pageSize",
        type: "number",
        default: 20,
        description: "Number of rows per page",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["get"],
          },
        },
      },

      // LIST: CREATE parameters
      {
        displayName: "List Name",
        name: "name",
        type: "string",
        default: "",
        required: true,
        description: "Name of the list to create",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Description",
        name: "description",
        type: "string",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "",
        description: "Description of the list (optional)",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["create"],
          },
        },
      },

      // LIST: ADD COLUMN parameters
      {
        displayName: "Column Name",
        name: "columnName",
        type: "string",
        default: "",
        required: true,
        description: "Name of the column to add",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["addColumn"],
          },
        },
      },

      // LIST: ADD ROWS parameters
      {
        displayName: "Add Rows Options",
        name: "addRowsOptions",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["addRows"],
          },
        },
      },
      {
        displayName: "Create Columns",
        name: "createColumnsAdd",
        type: "boolean",
        default: true,
        description: "Whether to create columns that don't exist",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["addRows"],
          },
        },
      },
      {
        displayName: "Match Fields",
        name: "matchFieldsAdd",
        type: "string",
        default: "",
        description: "Comma-separated field names to match existing rows (leave empty to always create new rows)",
        placeholder: "email,phone",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["addRows"],
          },
        },
      },
      {
        displayName: "Row Data",
        name: "rowDataAdd",
        type: "json",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "[]",
        required: true,
        description: "JSON array of objects containing the row data to add",
        placeholder: '[\n  {\n    "columnName1": "value1",\n    "columnName2": "value2"\n  },\n  {\n    "email": "example@domain.com",\n    "name": "John Doe",\n    "status": "Active"\n  }\n]',
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["addRows"],
          },
        },
      },

      // LIST: UPDATE ROWS parameters
      {
        displayName: "Update Rows Options",
        name: "updateRowsOptions",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["updateRows"],
          },
        },
      },
      {
        displayName: "Create Columns",
        name: "createColumnsUpdate",
        type: "boolean",
        default: false,
        description: "Whether to create columns that don't exist",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["updateRows"],
          },
        },
      },
      {
        displayName: "Match Fields",
        name: "matchFieldsUpdate",
        type: "string",
        default: "",
        description: "Comma-separated field names to match existing rows (leave empty to use row ID)",
        placeholder: "email,phone",
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["updateRows"],
          },
        },
      },
      {
        displayName: "Row Data",
        name: "rowDataUpdate",
        type: "json",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "[]",
        required: true,
        description: "JSON array of objects containing the row data to update",
        placeholder: '[\n  {\n    "id": "row-id-1",\n    "columnName1": "value1",\n    "columnName2": "value2"\n  },\n  {\n    "email": "example@domain.com",\n    "name": "John Doe",\n    "status": "Active"\n  }\n]',
        displayOptions: {
          show: {
            resource: ["list"],
            operation: ["updateRows"],
          },
        },
      },

      // DOCUMENT PARAMETERS
      // DOCUMENT: GET ALL parameters
      {
        displayName: "Path",
        name: "path",
        type: "string",
        default: "/",
        required: true,
        description: "Path to get documents and folders from",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["getAll"],
          },
        },
      },

      // DOCUMENT: GET parameters
      {
        displayName: "Document ID",
        name: "documentId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the document to retrieve",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["get", "update", "delete"],
          },
        },
      },
      {
        displayName: "Include Content",
        name: "includeContent",
        type: "boolean",
        default: false,
        description: "Whether to include the document content in the response",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["get"],
          },
        },
      },

      // DOCUMENT: CREATE parameters
      {
        displayName: "Document Type",
        name: "documentType",
        type: "options",
        options: [
          {
            name: "Text Content",
            value: "text"
          },
          {
            name: "File Upload",
            value: "file"
          }
        ],
        default: "text",
        required: true,
        description: "How to create the document",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Document Name",
        name: "name",
        type: "string",
        default: "",
        required: true,
        description: "Name of the document to create",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["create"],
            documentType: ["text"],
          },
        },
      },
      {
        displayName: "Document Content",
        name: "content",
        type: "string",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "",
        required: true,
        description: "Content of the document",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["create", "update"],
            documentType: ["text"],
          },
        },
      },
      {
        displayName: "File Path",
        name: "filePath",
        type: "string",
        default: "",
        required: true,
        description: "Path to the file to upload",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["create"],
            documentType: ["file"],
          },
        },
      },
      {
        displayName: "Document Path",
        name: "path",
        type: "string",
        default: "/",
        description: "Path where the document should be stored",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Tags",
        name: "tags",
        type: "string",
        default: "",
        description: "Comma-separated list of tags to assign to the document",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["create", "update"],
          },
        },
      },

      // DOCUMENT: UPDATE parameters
      {
        displayName: "Document Name",
        name: "name",
        type: "string",
        default: "",
        description: "New name for the document (leave empty to keep current name)",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["update"],
          },
        },
      },

      // DOCUMENT: SEARCH parameters
      {
        displayName: "Query",
        name: "query",
        type: "string",
        default: "",
        required: true,
        description: "Text query to search for in documents",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["search"],
          },
        },
      },
      {
        displayName: "Document Scope",
        name: "documentScopeType",
        type: "options",
        options: [
          {
            name: "All Documents",
            value: "all",
          },
          {
            name: "Specific Path",
            value: "path",
          },
          {
            name: "Specific Document",
            value: "document",
          },
        ],
        default: "all",
        description: "Scope of documents to search",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["search"],
          },
        },
      },
      {
        displayName: "Path",
        name: "documentPath",
        type: "string",
        default: "/",
        required: true,
        description: "Path to search documents in",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["search"],
            documentScopeType: ["path"],
          },
        },
      },
      {
        displayName: "Document ID",
        name: "scopeDocumentId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the specific document to search within",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["search"],
            documentScopeType: ["document"],
          },
        },
      },
      {
        displayName: "Minimum Score",
        name: "minScore",
        type: "number",
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
        default: 0.5,
        description: "Minimum similarity score threshold (0-1)",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["search"],
          },
        },
      },
      {
        displayName: "Maximum Results",
        name: "topK",
        type: "number",
        typeOptions: {
          minValue: 1,
          maxValue: 100,
        },
        default: 10,
        description: "Maximum number of results to return",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["search"],
          },
        },
      },
      
      // DOCUMENT: MOVE parameters
      {
        displayName: "Document ID",
        name: "documentId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the document to move",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["move"],
          },
        },
      },
      {
        displayName: "Target Folder Information",
        name: "folderSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["move"],
          },
        },
      },
      {
        displayName: "Folder Name",
        name: "folderName",
        type: "string",
        default: "",
        required: true,
        description: "Name of the target folder",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["move"],
          },
        },
      },
      {
        displayName: "Folder Path",
        name: "folderPath",
        type: "string",
        default: "/",
        required: true,
        description: "Path of the target folder",
        displayOptions: {
          show: {
            resource: ["document"],
            operation: ["move"],
          },
        },
      },

      // FOLDER PARAMETERS
      // FOLDER: CREATE parameters
      {
        displayName: "Folder Name",
        name: "name",
        type: "string",
        default: "",
        required: true,
        description: "Name of the folder to create",
        displayOptions: {
          show: {
            resource: ["folder"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Parent Path",
        name: "path",
        type: "string",
        default: "/",
        description: "Path where the folder should be created",
        displayOptions: {
          show: {
            resource: ["folder"],
            operation: ["create"],
          },
        },
      },

      // FOLDER: DELETE parameters
      {
        displayName: "Folder ID",
        name: "folderId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the folder to delete",
        displayOptions: {
          show: {
            resource: ["folder"],
            operation: ["delete"],
          },
        },
      },
      {
        displayName: "Delete Contents",
        name: "deleteContents",
        type: "boolean",
        default: false,
        description: "Whether to delete the folder contents or just move items to parent folder",
        displayOptions: {
          show: {
            resource: ["folder"],
            operation: ["delete"],
          },
        },
      },

      // SEQUENCE PARAMETERS
      // SEQUENCE: GET ALL parameters
      {
        displayName: "Pagination",
        name: "sequencePaginationSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["getAll"],
          },
        },
      },
      {
        displayName: "Page",
        name: "page",
        type: "number",
        default: 1,
        description: "Page number to retrieve",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["getAll", "getMembers"],
          },
        },
      },
      {
        displayName: "Page Size",
        name: "pageSize",
        type: "number",
        default: 20,
        description: "Number of items per page",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["getAll", "getMembers"],
          },
        },
      },

      // SEQUENCE: GET MEMBERS parameters
      {
        displayName: "Sequence ID",
        name: "sequenceId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the sequence",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["getMembers", "addMember", "removeMember", "triggerMember"],
          },
        },
      },

      // SEQUENCE: ADD MEMBER parameters
      {
        displayName: "Email",
        name: "email",
        type: "string",
        default: "",
        required: true,
        description: "Email address of the member",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["addMember"],
          },
        },
      },
      {
        displayName: "First Name",
        name: "firstName",
        type: "string",
        default: "",
        required: true,
        description: "First name of the member",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["addMember"],
          },
        },
      },
      {
        displayName: "Last Name",
        name: "lastName",
        type: "string",
        default: "",
        description: "Last name of the member",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["addMember"],
          },
        },
      },
      {
        displayName: "Phone",
        name: "phone",
        type: "string",
        default: "",
        description: "Phone number of the member",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["addMember"],
          },
        },
      },
      {
        displayName: "User Data",
        name: "userData",
        type: "json",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "{}",
        description: "Additional user data for the sequence in JSON format",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["addMember"],
          },
        },
      },

      // SEQUENCE: REMOVE MEMBER parameters
      {
        displayName: "Member ID",
        name: "memberId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the member to remove from the sequence",
        displayOptions: {
          show: {
            resource: ["sequence"],
            operation: ["removeMember", "triggerMember"],
          },
        },
      },
      
      // IMAGE: GENERATE parameters
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        default: "",
        required: true,
        description: "Text description of the image to generate",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
          },
        },
      },
      {
        displayName: "Model",
        name: "imageModel",
        type: "options",
        default: "gpt-image-1",
        description: "AI model to use for image generation",
        options: [
          {
            name: "GPT Image",
            value: "gpt-image-1",
            description: "Latest text-to-image model from OpenAI",
          },
          {
            name: "Leonardo Default",
            value: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
            description: "Default model for Leonardo.AI",
          },
          {
            name: "Flux Schnell",
            value: "1dd50843-d653-4516-a8e3-f0238ee453ff",
            description: "Flux Schnell model from Leonardo.AI",
          },
          {
            name: "Leonardo Phoenix 1.0",
            value: "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",
            description: "Leonardo Phoenix 1.0 model",
          },
          {
            name: "Kino",
            value: "aa77f04e-3eec-4034-9c07-d0f619684628",
            description: "Kino model from Leonardo.AI, great for cinematic-style images",
          },
        ],
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
          },
        },
      },
      {
        displayName: "DALL-E Options",
        name: "dalleOptionsSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: ["gpt-image-1"],
          },
        },
      },
      {
        displayName: "Size",
        name: "imageSize",
        type: "options",
        default: "1024x1024",
        description: "Size of the generated image",
        options: [
          {
            name: "Square (1024x1024)",
            value: "1024x1024",
          },
          {
            name: "Landscape (1792x1024)",
            value: "1792x1024",
          },
          {
            name: "Portrait (1024x1792)",
            value: "1024x1792",
          },
        ],
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: ["gpt-image-1"],
          },
        },
      },
      {
        displayName: "Quality",
        name: "imageQuality",
        type: "options",
        default: "auto",
        description: "Quality of the generated image",
        options: [
          {
            name: "Low",
            value: "low",
          },
          {
            name: "Medium",
            value: "medium",
          },
          {
            name: "High",
            value: "high",
          },
          {
            name: "Auto",
            value: "auto",
          },
        ],
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: ["gpt-image-1"],
          },
        },
      },
      {
        displayName: "Style",
        name: "imageStyle",
        type: "options",
        default: "vivid",
        description: "Style of the generated image",
        options: [
          {
            name: "Vivid",
            value: "vivid",
            description: "Hyper-real and dramatic images",
          },
          {
            name: "Natural",
            value: "natural",
            description: "More natural and less hyper-real images",
          },
        ],
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: ["gpt-image-1"],
          },
        },
      },
      {
        displayName: "Leonardo Options",
        name: "leonardoOptionsSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: [
              "b24e16ff-06e3-43eb-8d33-4416c2d75876",
              "1dd50843-d653-4516-a8e3-f0238ee453ff",
              "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",
              "aa77f04e-3eec-4034-9c07-d0f619684628",
            ],
          },
        },
      },
      {
        displayName: "Width",
        name: "imageWidth",
        type: "number",
        default: 512,
        description: "Width of the generated image",
        typeOptions: {
          minValue: 32,
          maxValue: 1536,
        },
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: [
              "b24e16ff-06e3-43eb-8d33-4416c2d75876",
              "1dd50843-d653-4516-a8e3-f0238ee453ff",
              "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",
              "aa77f04e-3eec-4034-9c07-d0f619684628",
            ],
          },
        },
      },
      {
        displayName: "Height",
        name: "imageHeight",
        type: "number",
        default: 512,
        description: "Height of the generated image",
        typeOptions: {
          minValue: 32,
          maxValue: 1536,
        },
        displayOptions: {
          show: {
            resource: ["image"],
            operation: ["generate"],
            imageModel: [
              "b24e16ff-06e3-43eb-8d33-4416c2d75876",
              "1dd50843-d653-4516-a8e3-f0238ee453ff",
              "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",
              "aa77f04e-3eec-4034-9c07-d0f619684628",
            ],
          },
        },
      },
    ],
  };

  methods = {
    loadOptions: {
      async getBrowserIntegrations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials("parallelAiApi");
        const baseUrl = credentials.baseUrl as string;
        const apiKey = credentials.apiKey as string;

        try {
          const options = {
            method: "GET" as "GET",
            uri: `${baseUrl}/api/v0/browser-integrations`,
            json: true,
            headers: {
              "X-API-KEY": apiKey,
            },
          };

          const response = await this.helpers.request!(options);
          const integrations = response.integrations || [];

          if (!integrations.length) {
            return [
              {
                name: "No browser integrations found",
                value: "",
                description: "Create a browser integration first",
              },
            ];
          }

          return integrations.map((integration: any) => ({
            name: `${integration.name} (${integration.type})`,
            value: integration.id,
            description: `Status: ${integration.status || "active"}`,
          }));
        } catch (error) {
          console.error("Error loading browser integrations:", error);
          return [
            {
              name: "Error loading browser integrations",
              value: "",
              description: "Please check API connection",
            },
          ];
        }
      },

      async getEmployees(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials("parallelAiApi");
        const baseUrl = credentials.baseUrl as string;
        const apiKey = credentials.apiKey as string;

        try {
          // Request options to fetch employees from the API
          const options = {
            method: "GET" as "GET",
            uri: `${baseUrl}/api/v0/employees`,
            json: true,
            headers: {
              "X-API-KEY": apiKey,
            },
          };

          // Make the request to fetch employees
          const responseData = await this.helpers.request!(options);
          const employees = responseData.employees || [];

          if (!employees.length) {
            return [{ name: "No employees found", value: "" }];
          }

          // Format employees for the dropdown
          return employees.map((employee: any) => ({
            name: `${employee.name} (${employee.title || "No title"})`,
            value: employee.id,
            description: employee.tags
              ? `Tags: ${employee.tags.join(", ")}`
              : "",
          }));
        } catch (error) {
          console.error("Error loading employees:", error);
          return [
            {
              name: "Error loading employees",
              value: "",
              description: "Please check API connection",
            },
          ];
        }
      },

      async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials("parallelAiApi");
        const baseUrl = credentials.baseUrl as string;
        const apiKey = credentials.apiKey as string;

        try {
          // Request options to fetch models from the API
          const options = {
            method: "GET" as "GET",
            uri: `${baseUrl}/api/v0/models`,
            json: true,
            headers: {
              "X-API-KEY": apiKey,
            },
          };

          // Make the request to fetch models
          const responseData = await this.helpers.request!(options);
          const models = responseData.models || [];

          // Format models for the dropdown
          return models.map((model: any) => ({
            name: `${model.label}`,
            value: model.name,
            description: model.tags.join(",") || `Model ID: ${model.id}`,
          }));
        } catch (error) {
          console.error("Error loading models:", error);
          return [
            {
              name: "Error loading models",
              value: "gpt-4",
              description: "Using default",
            },
          ];
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("parallelAiApi");
    const apiKey = credentials.apiKey as string;
    const baseUrl = credentials.baseUrl as string;

    const resource = this.getNodeParameter("resource", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;

    let responseData;

    // EMPLOYEE RESOURCE
    if (resource === "employee") {
      // Get all employees
      if (operation === "getAll") {
        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/employees`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Chat with employee
      else if (operation === "chat") {
        const employeeId = this.getNodeParameter("employeeId", 0) as string;
        const message = this.getNodeParameter("message", 0) as string;

        // Get all context settings from the node parameters
        const model = this.getNodeParameter("model", 0) as string;
        const documents = this.getNodeParameter("documents", 0) as boolean;
        const searchEngine = this.getNodeParameter("searchEngine", 0) as boolean;
        const websites = this.getNodeParameter("websites", 0) as boolean;
        const news = this.getNodeParameter("news", 0) as boolean;
        const shortTermMemories = this.getNodeParameter("shortTermMemories", 0) as boolean;
        const longTermMemories = this.getNodeParameter("longTermMemories", 0) as boolean;
        const memoryScope = longTermMemories ? (this.getNodeParameter("memoryScope", 0) as string) : "chat";
        const company = this.getNodeParameter("company", 0) as boolean;
        const employee = this.getNodeParameter("employee", 0) as boolean;
        const temperature = this.getNodeParameter("temperature", 0) as number;

        // Get tool settings
        const lists = this.getNodeParameter("lists", 0, false) as boolean;
        const researchTask = this.getNodeParameter("researchTask", 0, false) as boolean;
        const documentCreation = this.getNodeParameter("documentCreation", 0, false) as boolean;

        // Get browser task settings
        const browserTaskEnabled = this.getNodeParameter("browserTaskEnabled", 0, false) as boolean;
        const browserSessionType = browserTaskEnabled ? (this.getNodeParameter("browserSessionType", 0, "regular") as string) : "regular";

        // Get integration ID for authenticated sessions
        let browserIntegrationId: string | null = null;
        if (browserTaskEnabled && browserSessionType === "authenticated") {
          browserIntegrationId = this.getNodeParameter("browserIntegrationId", 0, "") as string;
        }

        // Get zipcode for residential proxy
        let browserZipcode: string | null = null;
        if (browserTaskEnabled && browserSessionType === "residential") {
          browserZipcode = this.getNodeParameter("browserZipcode", 0, "") as string;
        }

        // Construct browser task object
        const browserTask: any = {
          enabled: browserTaskEnabled,
          sessionType: browserSessionType,
        };

        if (browserIntegrationId) {
          browserTask.integrationId = browserIntegrationId;
        }

        if (browserZipcode) {
          browserTask.zipcode = browserZipcode;
        }

        // Construct settings object with all context settings
        const contextSettings: any = {
          model,
          documents,
          searchEngine,
          websites,
          websitesJs: websites, // For compatibility with existing code
          news,
          shortTermMemories,
          longTermMemories,
          memoryScope,
          company,
          employee,
          temperature,
          // Tool settings
          lists,
          researchTask,
          documentCreation,
          browserTask,
          strategy: "function-chain", // Always use function-chain, backend will handle model compatibility
          // Default values for other settings that aren't included in the node UI
          documentScope: "root",
          documentPath: "/",
          documentStrategy: "similarity-ranking",
        };

        const body: any = {
          employeeId,
          message,
          settings: contextSettings,
        };

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/employees/chat`,
          body,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
    }

    // LIST RESOURCE
    else if (resource === "list") {
      // Get all lists
      if (operation === "getAll") {
        const page = this.getNodeParameter("page", 0, 1) as number;
        const pageSize = this.getNodeParameter("pageSize", 0, 20) as number;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/lists?page=${page}&pageSize=${pageSize}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Get a specific list
      else if (operation === "get") {
        const listId = this.getNodeParameter("listId", 0) as string;
        const page = this.getNodeParameter("page", 0, 1) as number;
        const pageSize = this.getNodeParameter("pageSize", 0, 20) as number;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/lists/${listId}?page=${page}&pageSize=${pageSize}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Create a new list
      else if (operation === "create") {
        const name = this.getNodeParameter("name", 0) as string;
        const description = this.getNodeParameter("description", 0, "") as string;

        const listDict = {
          name,
          description,
        };

        const body = {
          listDict,
        };

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/lists`,
          body,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Add a column to a list
      else if (operation === "addColumn") {
        const listId = this.getNodeParameter("listId", 0) as string;
        const columnName = this.getNodeParameter("columnName", 0) as string;

        const body = {
          name: columnName,
        };

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/lists/${listId}/header`,
          body,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Add rows to a list
      else if (operation === "addRows") {
        const listId = this.getNodeParameter("listId", 0) as string;
        const createColumns = this.getNodeParameter("createColumnsAdd", 0, true) as boolean;
        const matchFields = this.getNodeParameter("matchFieldsAdd", 0, "") as string;

        // Get the row data as a JSON array of objects
        let rowDataStr = this.getNodeParameter("rowDataAdd", 0) as string;
        let rowData = [];

        try {
          if (typeof rowDataStr === 'string') {
            rowData = JSON.parse(rowDataStr);
          } else {
            rowData = rowDataStr;
          }

          // Ensure rowData is an array
          if (!Array.isArray(rowData)) {
            rowData = [rowData];
          }
        } catch (error) {
          throw new Error(`Invalid JSON format for rowData: ${error}`);
        }

        // Process each row
        const results = [];
        
        for (const row of rowData) {
          const options = {
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            method: "POST" as "POST",
            uri: `${baseUrl}/api/v0/lists/${listId}/rows?createColumns=${createColumns ? 'true' : 'false'}${matchFields ? `&matchFields=${matchFields}` : ''}`,
            body: { rows: [row] },
            json: true,
          };

          try {
            const rowResponseData = await this.helpers.request!(options);
            results.push(rowResponseData);
          } catch (error) {
            results.push({
              error: error.message,
              row,
            });
          }
        }

        responseData = results;
      }
      // Update rows in a list
      else if (operation === "updateRows") {
        const listId = this.getNodeParameter("listId", 0) as string;
        const createColumns = this.getNodeParameter("createColumnsUpdate", 0, false) as boolean;
        const matchFields = this.getNodeParameter("matchFieldsUpdate", 0, "") as string;

        // Get the row data as a JSON array of objects
        let rowDataStr = this.getNodeParameter("rowDataUpdate", 0) as string;
        let rowData = [];

        try {
          if (typeof rowDataStr === 'string') {
            rowData = JSON.parse(rowDataStr);
          } else {
            rowData = rowDataStr;
          }

          // Ensure rowData is an array
          if (!Array.isArray(rowData)) {
            rowData = [rowData];
          }
        } catch (error) {
          throw new Error(`Invalid JSON format for rowData: ${error}`);
        }

        // Process each row
        const results = [];
        
        for (const row of rowData) {
          // If match fields are provided, use the rows endpoint instead of row endpoint
          let options;
          if (matchFields) {
            options = {
              headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
              },
              method: "POST" as "POST",
              uri: `${baseUrl}/api/v0/lists/${listId}/rows?createColumns=${createColumns ? 'true' : 'false'}&matchFields=${matchFields}`,
              body: { rows: [row] },
              json: true,
            };
          } else {
            options = {
              headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
              },
              method: "PUT" as "PUT",
              uri: `${baseUrl}/api/v0/lists/${listId}/row`,
              body: { row },
              json: true,
            };
          }

          try {
            const rowResponseData = await this.helpers.request!(options);
            results.push(rowResponseData);
          } catch (error) {
            results.push({
              error: error.message,
              row,
            });
          }
        }

        responseData = results;
      }
    }

    // DOCUMENT RESOURCE
    else if (resource === "document") {
      // Get all documents
      if (operation === "getAll") {
        const path = this.getNodeParameter("path", 0) as string;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/documents?path=${encodeURIComponent(path)}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Get a specific document
      else if (operation === "get") {
        const documentId = this.getNodeParameter("documentId", 0) as string;
        const includeContent = this.getNodeParameter("includeContent", 0) as boolean;

        // First get document metadata
        const documentOptions = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/documents/${documentId}`,
          json: true,
        };

        const documentData = await this.helpers.request!(documentOptions);

        // If content is requested, get it separately
        if (includeContent) {
          const contentOptions = {
            headers: {
              "X-API-KEY": apiKey,
            },
            method: "GET" as "GET",
            uri: `${baseUrl}/api/v0/documents/${documentId}/content`,
            json: true,
          };

          const contentData = await this.helpers.request!(contentOptions);
          
          // Merge document metadata with content
          documentData.content = contentData.content;
        }

        responseData = documentData;
      }
      // Create a new document
      else if (operation === "create") {
        const documentType = this.getNodeParameter("documentType", 0) as string;
        const path = this.getNodeParameter("path", 0, "/") as string;
        const tagsString = this.getNodeParameter("tags", 0, "") as string;
        const tags = tagsString.split(",").map(tag => tag.trim()).filter(tag => tag !== "");

        if (documentType === "text") {
          // Create document from text content
          const name = this.getNodeParameter("name", 0) as string;
          const content = this.getNodeParameter("content", 0) as string;

          const options = {
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            method: "POST" as "POST",
            uri: `${baseUrl}/api/v0/documents`,
            body: {
              name,
              content,
              path,
              tags,
            },
            json: true,
          };

          responseData = await this.helpers.request!(options);
        } else {
          // Upload file as document
          const filePath = this.getNodeParameter("filePath", 0) as string;
          
          const options = {
            headers: {
              "X-API-KEY": apiKey,
            },
            method: "POST" as "POST",
            uri: `${baseUrl}/api/v0/documents`,
            formData: {
              file: {
                value: createReadStream(filePath),
                options: {
                  filename: filePath.split('/').pop(),
                },
              },
              path,
              tags: tags.join(","),
            },
            json: true,
          };

          responseData = await this.helpers.request!(options);
        }
      }
      // Update a document
      else if (operation === "update") {
        const documentId = this.getNodeParameter("documentId", 0) as string;
        const name = this.getNodeParameter("name", 0, "") as string;
        const content = this.getNodeParameter("content", 0) as string;
        const tagsString = this.getNodeParameter("tags", 0, "") as string;
        
        // Only include tags if provided
        const body: { content: string; name?: string; tags?: string[] } = { content };
        
        if (name) {
          body.name = name;
        }
        
        if (tagsString) {
          body.tags = tagsString.split(",").map(tag => tag.trim()).filter(tag => tag !== "");
        }

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "PUT" as "PUT",
          uri: `${baseUrl}/api/v0/documents/${documentId}`,
          body,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Delete a document
      else if (operation === "delete") {
        const documentId = this.getNodeParameter("documentId", 0) as string;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "DELETE" as "DELETE",
          uri: `${baseUrl}/api/v0/documents/${documentId}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Move a document
      else if (operation === "move") {
        const documentId = this.getNodeParameter("documentId", 0) as string;
        const folderName = this.getNodeParameter("folderName", 0) as string;
        const folderPath = this.getNodeParameter("folderPath", 0) as string;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/documents/move`,
          body: {
            documentId,
            folder: {
              name: folderName,
              path: folderPath,
            },
          },
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Search documents
      else if (operation === "search") {
        const query = this.getNodeParameter("query", 0) as string;
        const documentScopeType = this.getNodeParameter("documentScopeType", 0) as string;
        const minScore = this.getNodeParameter("minScore", 0) as number;
        const topK = this.getNodeParameter("topK", 0) as number;
        
        // Prepare document scope object based on scope type
        let documentScope = {};
        
        if (documentScopeType === "path") {
          const documentPath = this.getNodeParameter("documentPath", 0) as string;
          documentScope = {
            type: "folder",
            path: documentPath
          };
        } else if (documentScopeType === "document") {
          const scopeDocumentId = this.getNodeParameter("scopeDocumentId", 0) as string;
          documentScope = {
            type: "file",
            id: scopeDocumentId
          };
        } else {
          // For "all" scope, use root scope
          documentScope = {
            type: "root"
          };
        }
        
        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/documents/search`,
          body: {
            query,
            documentScope,
            minScore,
            topK
          },
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
    }

    // FOLDER RESOURCE
    else if (resource === "folder") {
      // Get all folders
      if (operation === "getAll") {
        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/documents/folders`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Create a new folder
      else if (operation === "create") {
        const name = this.getNodeParameter("name", 0) as string;
        const path = this.getNodeParameter("path", 0, "/") as string;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/documents/folders`,
          body: {
            name,
            path,
          },
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Delete a folder
      else if (operation === "delete") {
        const folderId = this.getNodeParameter("folderId", 0) as string;
        const deleteContents = this.getNodeParameter("deleteContents", 0) as boolean;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "DELETE" as "DELETE",
          uri: `${baseUrl}/api/v0/documents/folders/${folderId}?delete=${deleteContents}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
    }

    // SEQUENCE RESOURCE
    else if (resource === "sequence") {
      // Get all sequences
      if (operation === "getAll") {
        const page = this.getNodeParameter("page", 0, 1) as number;
        const pageSize = this.getNodeParameter("pageSize", 0, 20) as number;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/sequences?page=${page}&pageSize=${pageSize}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Get sequence members
      else if (operation === "getMembers") {
        const sequenceId = this.getNodeParameter("sequenceId", 0) as string;
        const page = this.getNodeParameter("page", 0, 1) as number;
        const pageSize = this.getNodeParameter("pageSize", 0, 20) as number;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/sequences/${sequenceId}/members?page=${page}&pageSize=${pageSize}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Add a member to a sequence
      else if (operation === "addMember") {
        const sequenceId = this.getNodeParameter("sequenceId", 0) as string;
        const email = this.getNodeParameter("email", 0) as string;
        const firstName = this.getNodeParameter("firstName", 0) as string;
        const lastName = this.getNodeParameter("lastName", 0, "") as string;
        const phone = this.getNodeParameter("phone", 0, "") as string;
        
        // Parse user data if provided
        let userData = {};
        const userDataStr = this.getNodeParameter("userData", 0, "{}") as string;
        
        try {
          if (typeof userDataStr === 'string') {
            userData = JSON.parse(userDataStr);
          } else {
            userData = userDataStr;
          }
        } catch (error) {
          throw new Error(`Invalid JSON format for userData: ${error}`);
        }

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/sequences/${sequenceId}/members`,
          body: {
            email,
            firstName,
            lastName,
            phone,
            userData,
          },
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Remove a member from a sequence
      else if (operation === "removeMember") {
        const sequenceId = this.getNodeParameter("sequenceId", 0) as string;
        const memberId = this.getNodeParameter("memberId", 0) as string;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "DELETE" as "DELETE",
          uri: `${baseUrl}/api/v0/sequences/${sequenceId}/members/${memberId}`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Trigger a sequence member
      else if (operation === "triggerMember") {
        const sequenceId = this.getNodeParameter("sequenceId", 0) as string;
        const memberId = this.getNodeParameter("memberId", 0) as string;

        const options = {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/sequences/${sequenceId}/members/${memberId}/trigger`,
          body: {},
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
    }

    // IMAGE RESOURCE
    else if (resource === "image") {
      // Generate an image
      if (operation === "generate") {
        const prompt = this.getNodeParameter("prompt", 0) as string;
        const model = this.getNodeParameter("imageModel", 0) as string;

        // Prepare request body
        const body: Record<string, any> = {
          prompt,
          model,
        };

        // Add model-specific parameters
        if (model === "dall-e-3") {
          body.size = this.getNodeParameter("imageSize", 0) as string;
          body.quality = this.getNodeParameter("imageQuality", 0) as string;
          body.style = this.getNodeParameter("imageStyle", 0) as string;
        } else {
          body.width = this.getNodeParameter("imageWidth", 0) as number;
          body.height = this.getNodeParameter("imageHeight", 0) as number;
        }

        // Make the API request
        const options = {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          method: "POST" as "POST",
          uri: `${baseUrl}/api/v0/images/generate`,
          body,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Get available image models
      else if (operation === "getModels") {
        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/images/models`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
    }
    // SYSTEM RESOURCE
    else if (resource === "system") {
      // Get available models
      if (operation === "getModels") {
        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/models`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
      // Get user settings
      else if (operation === "getSettings") {
        const options = {
          headers: {
            "X-API-KEY": apiKey,
          },
          method: "GET" as "GET",
          uri: `${baseUrl}/api/v0/settings`,
          json: true,
        };

        responseData = await this.helpers.request!(options);
      }
    }

    else {
      throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`, {
        description: 'Please check the documentation for supported resources',
      });
    }

    // Prepare standard output
    const standardOutput = Array.isArray(responseData) ? responseData : [responseData];

    // Prepare AI tool output for employee chat operations
    let aiToolOutput = standardOutput;
    
    if (resource === "employee" && operation === "chat" && responseData?.response) {
      // Format for AI Tool output - provide the actual response content
      aiToolOutput = [{
        output: responseData.response,
        metadata: {
          employeeId: this.getNodeParameter("employeeId", 0),
          operation: "chat",
          model: this.getNodeParameter("model", 0),
        }
      }];
    } else if (resource === "document" && operation === "search" && responseData?.results) {
      // Format document search results for AI Tool output (similar to KnowledgeBaseRetriever)
      aiToolOutput = [{
        output: responseData.results,
        metadata: {
          operation: "document_search",
          query: this.getNodeParameter("query", 0),
        }
      }];
    }

    return [
      this.helpers.returnJsonArray(standardOutput),
      this.helpers.returnJsonArray(aiToolOutput),
    ];
  }
}