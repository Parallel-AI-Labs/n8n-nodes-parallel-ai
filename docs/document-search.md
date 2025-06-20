# Document Search Operation

This document describes how to use the Document Search operation in the Parallel AI node for n8n.

## Overview

The Document Search operation allows you to search for documents in your knowledge base that match a text query. It uses semantic search with embeddings to find relevant documents, regardless of whether they contain the exact words from your query.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Query | String | The text query to search for in your documents. |
| Document Scope | Options | Choose the scope of documents to search within (All Documents, Specific Path, or Specific Document). |
| Path | String | (Only when Document Scope = Specific Path) The folder path to search documents in. |
| Document ID | String | (Only when Document Scope = Specific Document) The ID of the specific document to search within. |
| Minimum Score | Number | Similarity score threshold (0-1). Only documents with a score above this threshold will be returned. Default: 0.5 |
| Maximum Results | Number | Maximum number of document results to return. Default: 10 |

## Example Usage

### Search all documents for information about a specific topic

1. Add the Parallel AI node to your workflow
2. Select "Document" as the resource
3. Select "Search" as the operation
4. Enter your query in the "Query" field (e.g., "customer return policy")
5. Select "All Documents" as the Document Scope
6. Adjust the Minimum Score and Maximum Results as needed
7. Execute the node

### Search documents in a specific folder

1. Add the Parallel AI node to your workflow
2. Select "Document" as the resource
3. Select "Search" as the operation
4. Enter your query in the "Query" field
5. Select "Specific Path" as the Document Scope
6. Enter the folder path (e.g., "/marketing") in the "Path" field
7. Adjust the Minimum Score and Maximum Results as needed
8. Execute the node

### Search within a specific document

1. Add the Parallel AI node to your workflow
2. Select "Document" as the resource
3. Select "Search" as the operation
4. Enter your query in the "Query" field
5. Select "Specific Document" as the Document Scope
6. Enter the Document ID in the "Document ID" field
7. Adjust the Minimum Score and Maximum Results as needed
8. Execute the node

## Output

The node outputs the search results, which include:
- Whether any documents were found (`found`)
- The document results formatted as text (`results`)

The results include the source, title, and content from each matching document.

## API Details

This operation uses the `/api/v0/documents/search` endpoint from the Parallel AI API.

## Notes

- The search uses embeddings to find semantically similar content, not just keyword matching
- You can adjust the minimum score to control how strict the matching should be
- For best results, make your queries specific and clear