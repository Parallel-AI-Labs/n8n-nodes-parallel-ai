# Using the Parallel AI Knowledge Base Search in n8n

The **Knowledge Base → Search** operation of the Parallel AI node allows you to search through your company's knowledge base using semantic search and integrate the results into n8n AI Agent workflows.

## Overview

This operation connects to the Parallel AI document search API and returns relevant documents based on a text query. It's specifically designed to work with the n8n AI Agent system as a retriever, allowing you to enrich AI workflows with knowledge from your document base.

## Key Features

- Semantic search of documents based on meaning, not just keywords
- Configurable scope for searching all documents, specific paths, or individual documents
- Adjustable similarity threshold and result limit
- Compatible with n8n's AI Agent system as a retriever
- Accepts expressions so the query can come from previous nodes

## Usage

### Basic Configuration

1. Add the "Parallel AI" node to your workflow
2. Configure your API credentials in the node settings
3. Set **Resource** to "Knowledge Base" and **Operation** to "Search"
4. Enter a search query (or use an expression to take it from a previous node)
5. Set additional parameters:
   - Document Scope: All Documents, Specific Path, or Specific Document
   - Minimum Score: Threshold for relevance (0-1)
   - Maximum Results: Number of results to return

### Integration with AI Agents

The Parallel AI node provides two outputs:

1. **Standard Output**: Contains the search results in a user-friendly format
2. **AI Tool Output**: Formatted specifically for integration with n8n's AI Agent system

To use with AI Agents:

1. Connect the "AI Tool Output" to an AI Agent node
2. The agent will be able to use information from the retrieved documents when generating responses

### Example Workflow: Question Answering with Knowledge Base

1. Start with a "Manual Trigger" node
2. Connect to a "Set" node to define your query
3. Connect to the "Parallel AI" node (Resource: Knowledge Base, Operation: Search)
4. Connect the AI Tool output to an "AI Agent" node
5. Configure the AI Agent with a prompt like "Answer the question using the retrieved documents"

This creates a workflow that retrieves relevant documents from your knowledge base and uses them to answer questions.

## Parameters

| Parameter | Description |
|-----------|-------------|
| Query | The text query to search for in the knowledge base |
| Document Scope | Choose between All Documents, Specific Path, or Specific Document |
| Path | (Only for Specific Path) The folder path to search documents in |
| Document ID | (Only for Specific Document) The ID of the specific document to search within |
| Minimum Score | Similarity score threshold (0-1). Only documents with a score above this threshold will be returned |
| Maximum Results | Maximum number of document results to return |

## Output Format

The AI Tool output follows this structure:

```json
{
  "documents": [
    {
      "pageContent": "The actual document content...",
      "metadata": {
        "title": "Document Title",
        "source": "knowledge-base-search-0"
      }
    },
    // More documents...
  ]
}
```

This format is compatible with n8n's AI Agent system, allowing for seamless integration of knowledge base search into your AI workflows.