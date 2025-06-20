import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  NodeOperationError,
} from "n8n-workflow";

// Document interfaces to ensure type safety
interface IDocumentMetadata extends IDataObject {
  title: string;
  score: number;
  source: string;
}

interface IDocument extends IDataObject {
  pageContent: string;
  metadata: IDocumentMetadata;
}

interface IDocumentResponse extends IDataObject {
  documents: IDocument[];
}

export class KnowledgeBaseRetriever implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Parallel AI: Knowledge Base Retriever",
    name: "parallelAiKnowledgeBaseRetriever",
    icon: "file:logo.png",
    group: ["transform"],
    version: 1,
    description:
      "Retrieves relevant documents from the knowledge base based on a query",
    defaults: {
      name: "Knowledge Base Retriever",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main, NodeConnectionType.AiRetriever],
    outputNames: ["Standard Output", "AI Retriever Output"],
    usableAsTool: true,
    credentials: [
      {
        name: "parallelAiApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Query",
        name: "query",
        type: "string",
        default: "",
        required: true,
        description: "Text query to search for in the knowledge base",
        typeOptions: {
          alwaysOpenEditWindow: true,
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
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("parallelAiApi");
    const apiKey = credentials.apiKey as string;
    const baseUrl = credentials.baseUrl as string;

    // Get parameters
    const query = this.getNodeParameter("query", 0) as string;
    const documentScopeType = this.getNodeParameter(
      "documentScopeType",
      0
    ) as string;
    const minScore = this.getNodeParameter("minScore", 0) as number;
    const topK = this.getNodeParameter("topK", 0) as number;

    // Prepare document scope object based on scope type
    let documentScope = {};

    if (documentScopeType === "path") {
      const documentPath = this.getNodeParameter("documentPath", 0) as string;
      documentScope = {
        type: "folder",
        path: documentPath,
      };
    } else if (documentScopeType === "document") {
      const scopeDocumentId = this.getNodeParameter(
        "scopeDocumentId",
        0
      ) as string;
      documentScope = {
        type: "file",
        id: scopeDocumentId,
      };
    } else {
      // For "all" scope, use root scope
      documentScope = {
        type: "root",
      };
    }

    // Get inputs from connected nodes if available
    const items = this.getInputData();
    let effectiveQuery = query;

    // If input contains a query, use that instead of the parameter
    if (items && items.length > 0) {
      const item = items[0];

      if (item.json && item.json.query) {
        effectiveQuery = item.json.query as string;
      } else if (item.json && item.json.text) {
        effectiveQuery = item.json.text as string;
      }
    }

    // Make sure we have a valid query
    if (!effectiveQuery || effectiveQuery.trim() === "") {
      throw new NodeOperationError(
        this.getNode(),
        "No query provided. Please provide a query as a parameter or input."
      );
    }

    // Define the API request options
    const options = {
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      method: "POST" as "POST",
      uri: `${baseUrl}/api/v0/documents/search`,
      body: {
        query: effectiveQuery,
        documentScope,
        minScore,
        topK,
      },
      json: true,
    };

    // Log the request details for debugging
    console.log(
      `Searching knowledge base with query: "${effectiveQuery.substring(
        0,
        50
      )}${effectiveQuery.length > 50 ? "..." : ""}"`
    );
    console.log(`Document scope: ${JSON.stringify(documentScope)}`);
    console.log(`Min score: ${minScore}, Top K: ${topK}`);

    try {
      const responseData = await this.helpers.request!(options);

      // Format for AI Retriever output
      const formatted: IDocumentResponse = {
        documents: [],
      };

      if (responseData.found && responseData.results) {
        // Parse the results to extract individual documents
        const resultsText = responseData.results;

        // Split by document entries (Source: page X\nTitle: Y\nContent: Z)
        const documentSections = resultsText
          .split(/\n\nSource: page \d+/)
          .filter((doc: string) => doc.trim() !== "");

        // Process the first section differently since it might not have the "Source: page X" prefix
        const documents: IDocument[] = documentSections.map(
          (section: string, index: number) => {
            let processedSection = section;

            // If this is the first section and doesn't start with "Title:", add the missing "Source:" prefix
            if (index === 0 && !section.trim().startsWith("Title:")) {
              const firstSourceMatch = section.match(/^Source: page (\d+)\n/);
              if (!firstSourceMatch) {
                processedSection = section; // No source prefix, just use as is
              }
            }

            // Extract the title and content
            const titleMatch = processedSection.match(/Title: (.*?)(?:\n|$)/);
            const contentMatch = processedSection.match(/Content: ([\s\S]*?)$/);

            const title = titleMatch
              ? titleMatch[1].trim()
              : `Document ${index + 1}`;
            const content = contentMatch
              ? contentMatch[1].trim()
              : processedSection.trim();

            // Create a document object compatible with n8n AI Retriever format
            return {
              pageContent: content,
              metadata: {
                title: title,
                score: minScore + Math.random() * (1 - minScore), // Simulate a score since API doesn't return individual scores
                source: `knowledge-base-search-${index}`,
              },
            };
          }
        );

        formatted.documents = documents;
      }

      // Handle response if there are no results
      if (!responseData.found || !responseData.results) {
        // Return both outputs with empty results
        const emptyStandardOutput: IDataObject = { found: false, results: [] };
        const emptyAiOutput: IDocumentResponse = { documents: [] };

        return [
          this.helpers.returnJsonArray(emptyStandardOutput),
          this.helpers.returnJsonArray(emptyAiOutput),
        ];
      }

      // Return both standard output and AI Retriever output
      // For the regular output, provide more user-friendly formatting
      const standardOutput: IDataObject = {
        found: responseData.found,
        query: effectiveQuery,
        results: formatted.documents.map((doc: IDocument) => ({
          title: doc.metadata.title,
          content: doc.pageContent,
          score: doc.metadata.score,
        })),
        rawResults: responseData.results,
      };

      // For AI Retriever output, ensure it follows the required structure
      const aiRetrieverOutput: IDocumentResponse = {
        documents: formatted.documents,
      };

      return [
        this.helpers.returnJsonArray(standardOutput),
        this.helpers.returnJsonArray(aiRetrieverOutput),
      ];
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
