# Parallel AI Node for n8n

This package provides a custom [n8n](https://n8n.io) node to interact with the
[Parallel AI](https://parallellabs.app) platform: chat with AI employees,
search your knowledge base, run browser automation tasks, generate images and
videos, manage documents, folders, lists and sequences — or call any endpoint
of the Parallel AI API directly.

## Node

The package registers a single **Parallel AI** node (`parallelAi`). Every
capability is exposed through the standard n8n **Resource / Operation**
pattern: pick a *Resource*, then an *Operation*, then fill in the parameters
for that operation.

| Resource | Operations |
|---|---|
| **API (Any Operation)** | Any operation in the Parallel AI OpenAPI spec. Resources, operations and parameter fields are loaded live from the spec, so new endpoints appear without updating the package. |
| **Browser Task** | Run (submit and wait for the result), Create (submit and return the task ID), Get (fetch status/result by ID) |
| **Document** | Create, Delete, Get, Get Many, Move, Search, Update |
| **Employee** | Chat, Get Many |
| **Folder** | Create, Delete, Get Many |
| **Image** | Generate, Get Models |
| **Knowledge Base** | Search — semantic retrieval formatted for AI agents (`documents` array with `pageContent` / `metadata`) |
| **List** | Add Column, Add Rows, Create, Get, Get Many, Update Rows |
| **Sequence** | Add Member, Get Many, Get Members, Remove Member, Trigger Member |
| **System** | Get Models, Get Settings |
| **Video** | Generate, Get Models, Get Status |

The node has two outputs: **Standard Output** (the raw API response) and
**AI Tool Output** (a simplified shape suited to AI Agent tool/retriever use).
It is also marked *usable as a tool*, so it can be attached directly to an
n8n AI Agent.

## Credentials

The node authenticates with a **Parallel AI API** credential (`parallelAiApi`).

1. In Parallel AI, open your account settings and copy your API key.
2. In n8n, go to **Credentials > New**, search for **Parallel AI API**.
3. Paste the API key. Leave the base URL at its default unless you use a
   self-hosted instance.

## Installation

### In n8n (community node)

In your n8n instance, go to **Settings > Community Nodes**, select **Install**,
and enter the package name:

```
@parallel-ai/n8n-nodes-parallel-ai
```

## Usage examples

### Example 1: Chat with an AI employee

Ask one of your Parallel AI employees a question and use the answer downstream.

1. Add a **Manual Trigger** node.
2. Add the **Parallel AI** node and connect it to the trigger.
3. Select your **Parallel AI API** credential.
4. Set **Resource** to `Employee` and **Operation** to `Chat`.
5. Pick an employee from the **Employee** dropdown (it is loaded from your
   account) and optionally a **Model**.
6. In **Message**, enter the prompt, e.g.
   `Summarize our Q3 marketing plan in three bullet points.` (or use an
   expression such as `{{ $json.question }}` to pass in data from a previous
   node).
7. Execute the node.

Standard Output contains the full chat response; AI Tool Output contains just
the reply text:

```json
{
  "output": "Here are the three key points of the Q3 marketing plan: …",
  "metadata": { "employeeId": "emp_123", "operation": "chat", "model": "gpt-4o" }
}
```

### Example 2: Run a browser task

Have a Parallel AI browser agent complete a task described in plain English.

1. Add the **Parallel AI** node.
2. Set **Resource** to `Browser Task` and **Operation** to `Run`.
3. In **Task**, describe what to do, e.g.
   `Go to https://news.ycombinator.com and return the titles of the top 5 stories.`
4. Leave **Session Type** as `Regular` (choose `Authenticated` to use a saved
   browser integration, or `Residential Proxy` to browse from a US zipcode).
5. Optionally enable **Use Vision** and adjust **Timeout** / **Poll Interval**.
6. Execute the node. It submits the task and polls until it finishes.

Output:

```json
{
  "success": true,
  "result": "1. … 2. … 3. … 4. … 5. …",
  "history": ["Navigated to https://news.ycombinator.com", "Extracted story titles"],
  "creditsCharged": 12,
  "task": "Go to https://news.ycombinator.com and return the titles of the top 5 stories.",
  "sessionType": "regular",
  "useVision": false,
  "taskId": "bt_abc123"
}
```

For long-running tasks, use **Operation → Create** to get a `taskId` back
immediately, then **Operation → Get** with that ID later (for example after a
**Wait** node) to fetch the status and result.

### Example 3: Search the knowledge base from an AI Agent

Retrieve relevant documents from your company knowledge base.

1. Add the **Parallel AI** node.
2. Set **Resource** to `Knowledge Base` and **Operation** to `Search`.
3. Enter a **Query** such as `What is our refund policy?`.
4. Choose a **Document Scope**: `All Documents`, `Specific Path` (e.g. `/policies`)
   or `Specific Document` (by document ID).
5. Set **Minimum Score** (0–1, default `0.5`) and **Maximum Results**
   (default `10`).
6. Execute the node.

Standard Output:

```json
{
  "found": true,
  "query": "What is our refund policy?",
  "results": [
    { "title": "Refund Policy", "content": "Customers may request a refund within 30 days…" }
  ],
  "documents": [
    {
      "pageContent": "Customers may request a refund within 30 days…",
      "metadata": { "title": "Refund Policy", "source": "knowledge-base-search-0" }
    }
  ],
  "rawResults": "Title: Refund Policy\nContent: Customers may request a refund within 30 days…"
}
```

AI Tool Output contains only `{ "documents": [ … ] }`, the shape expected by
n8n AI retriever/tool consumers. See
[docs/using-knowledge-base-retriever.md](docs/using-knowledge-base-retriever.md)
and [docs/document-search.md](docs/document-search.md) for more detail.

### Example 4: Call any API endpoint

Use the spec-driven **API (Any Operation)** resource for endpoints that do not
have a dedicated operation.

1. Add the **Parallel AI** node.
2. Set **Resource** to `API (Any Operation)`.
3. Choose an **API Resource** (an API category, e.g. `Employees`) and an
   **Operation** (e.g. `Get Employee`). Both lists are loaded live from the
   Parallel AI OpenAPI spec.
4. The **Parameters** section fills in with the path, query and body
   parameters that operation accepts; set the ones you need (required
   parameters are marked).
5. Execute the node. The node issues one request per input item and returns
   the JSON response of each.

## Local development

```bash
npm install
npm run build      # clean, compile TypeScript, copy icons
npm run dev        # tsc --watch
npm run lint       # eslint (includes eslint-plugin-n8n-nodes-base)
npm run format     # prettier
```

Then link the module into your local n8n installation:

```bash
cd /path/to/n8n
npm link /path/to/n8n-nodes-parallel-ai
```

## License

[MIT](LICENSE)
