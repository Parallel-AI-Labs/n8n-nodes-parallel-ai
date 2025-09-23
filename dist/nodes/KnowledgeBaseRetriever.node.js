"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseRetriever = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class KnowledgeBaseRetriever {
    constructor() {
        this.description = {
            displayName: "Parallel AI: Knowledge Base Retriever",
            name: "parallelAiKnowledgeBaseRetriever",
            icon: "file:logo.png",
            group: ["transform"],
            version: 1,
            description: "Retrieves relevant documents from the knowledge base based on a query",
            defaults: {
                name: "Knowledge Base Retriever",
            },
            inputs: ["main"],
            outputs: ["main", "ai_retriever"],
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
    }
    async execute() {
        const credentials = await this.getCredentials("parallelAiApi");
        const apiKey = credentials.apiKey;
        const baseUrl = credentials.baseUrl;
        const query = this.getNodeParameter("query", 0);
        const documentScopeType = this.getNodeParameter("documentScopeType", 0);
        const minScore = this.getNodeParameter("minScore", 0);
        const topK = this.getNodeParameter("topK", 0);
        let documentScope = {};
        if (documentScopeType === "path") {
            const documentPath = this.getNodeParameter("documentPath", 0);
            documentScope = {
                type: "folder",
                path: documentPath,
            };
        }
        else if (documentScopeType === "document") {
            const scopeDocumentId = this.getNodeParameter("scopeDocumentId", 0);
            documentScope = {
                type: "file",
                id: scopeDocumentId,
            };
        }
        else {
            documentScope = {
                type: "root",
            };
        }
        const items = this.getInputData();
        let effectiveQuery = query;
        if (items && items.length > 0) {
            const item = items[0];
            if (item.json && item.json.query) {
                effectiveQuery = item.json.query;
            }
            else if (item.json && item.json.text) {
                effectiveQuery = item.json.text;
            }
        }
        if (!effectiveQuery || effectiveQuery.trim() === "") {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), "No query provided. Please provide a query as a parameter or input.");
        }
        const options = {
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
            method: "POST",
            uri: `${baseUrl}/api/v0/documents/search`,
            body: {
                query: effectiveQuery,
                documentScope,
                minScore,
                topK,
            },
            json: true,
        };
        console.log(`Searching knowledge base with query: "${effectiveQuery.substring(0, 50)}${effectiveQuery.length > 50 ? "..." : ""}"`);
        console.log(`Document scope: ${JSON.stringify(documentScope)}`);
        console.log(`Min score: ${minScore}, Top K: ${topK}`);
        try {
            const responseData = await this.helpers.request(options);
            const formatted = {
                documents: [],
            };
            if (responseData.found && responseData.results) {
                const resultsText = responseData.results;
                const documentSections = resultsText
                    .split(/\n\nSource: page \d+/)
                    .filter((doc) => doc.trim() !== "");
                const documents = documentSections.map((section, index) => {
                    let processedSection = section;
                    if (index === 0 && !section.trim().startsWith("Title:")) {
                        const firstSourceMatch = section.match(/^Source: page (\d+)\n/);
                        if (!firstSourceMatch) {
                            processedSection = section;
                        }
                    }
                    const titleMatch = processedSection.match(/Title: (.*?)(?:\n|$)/);
                    const contentMatch = processedSection.match(/Content: ([\s\S]*?)$/);
                    const title = titleMatch
                        ? titleMatch[1].trim()
                        : `Document ${index + 1}`;
                    const content = contentMatch
                        ? contentMatch[1].trim()
                        : processedSection.trim();
                    return {
                        pageContent: content,
                        metadata: {
                            title: title,
                            score: minScore + Math.random() * (1 - minScore),
                            source: `knowledge-base-search-${index}`,
                        },
                    };
                });
                formatted.documents = documents;
            }
            if (!responseData.found || !responseData.results) {
                const emptyStandardOutput = { found: false, results: [] };
                const emptyAiOutput = { documents: [] };
                return [
                    this.helpers.returnJsonArray(emptyStandardOutput),
                    this.helpers.returnJsonArray(emptyAiOutput),
                ];
            }
            const standardOutput = {
                found: responseData.found,
                query: effectiveQuery,
                results: formatted.documents.map((doc) => ({
                    title: doc.metadata.title,
                    content: doc.pageContent,
                    score: doc.metadata.score,
                })),
                rawResults: responseData.results,
            };
            const aiRetrieverOutput = {
                documents: formatted.documents,
            };
            return [
                this.helpers.returnJsonArray(standardOutput),
                this.helpers.returnJsonArray(aiRetrieverOutput),
            ];
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
exports.KnowledgeBaseRetriever = KnowledgeBaseRetriever;
//# sourceMappingURL=KnowledgeBaseRetriever.node.js.map