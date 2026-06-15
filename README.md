# Parallel AI Nodes for n8n

This package provides custom [n8n](https://n8n.io) nodes to interact with the
[Parallel AI](https://parallellabs.app) platform.

## Nodes

- **Parallel AI** (`parallelAi`): Interact with Parallel AI across multiple
  resources — Employees (chat, list), Images, Videos, Lists, Documents,
  Folders, Sequences, and System settings.
- **Parallel AI: Knowledge Base Retriever** (`parallelAiKnowledgeBaseRetriever`):
  Search and retrieve documents from your knowledge base for use in AI Agent
  workflows. Supports scoping by all documents, a specific path, or a specific
  document, with a minimum similarity score and a maximum result count.
- **Parallel AI: Browser Task** (`parallelAiBrowserTask`): Run automated
  browser tasks. Supports regular, authenticated (via integration), and
  residential-proxy sessions, optional vision, and configurable timeout and
  poll interval for long-running tasks.

## Credentials

All nodes authenticate with a **Parallel AI API** credential
(`parallelAiApi`). Create one with your Parallel AI API key from your account
settings.

## Installation

### In n8n (community node)

In your n8n instance, go to **Settings > Community Nodes**, select **Install**,
and enter the package name:

```
@parallel-ai/n8n-nodes-parallel-ai
```

### Local development

```bash
npm install
npm run build
```

Then link the module into your local n8n installation:

```bash
cd /path/to/n8n
npm link /path/to/n8n-nodes-parallel-ai
```

## Development

```bash
npm run build      # clean, compile TypeScript, copy icons
npm run dev        # tsc --watch
npm run lint       # eslint (includes eslint-plugin-n8n-nodes-base)
npm run format     # prettier
```

## License

[MIT](LICENSE)
