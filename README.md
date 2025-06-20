# Parallel AI Nodes for n8n

This package provides custom n8n nodes to interact with the Parallel AI platform.

## Features

- **Parallel AI Chat Model**: Use Parallel AI models for text generation (GPT-4, Claude, Gemini, etc.)
- **EmployeeChat Node**: Chat with AI employees with full control over context settings
- **EmployeeList Node**: List all AI employees in your company
- **ModelsGet Node**: Get information about available AI models
- **SettingsGet Node**: Get information about account settings
- **Knowledge Base Retriever Node**: Search and retrieve documents from your knowledge base for AI Agent workflows

## Building

To build the nodes, run:

```bash
npm install
npm run build
```

## Testing

After building, you can test the EmployeeChat node with:

```bash
node test-employee-chat.js
```

## Using with n8n

Link the module to your n8n installation:

```bash
cd /path/to/n8n
npm link /path/to/n8n-nodes-parallel-ai
```

Or use the sync script:

```bash
./sync-parallel-ai-to-n8n.sh
```

## EmployeeChat Node

The EmployeeChat node allows you to interact with AI employees in your Parallel AI account. It provides fine-grained control over the AI's behavior through various context settings.

### Dynamic Dropdowns

The node includes dynamic dropdown selectors that fetch real-time data from your Parallel AI account:

- **Employee Selection**: Automatically loads and displays all available employees with their names and job titles
- **Model Selection**: Displays all available AI models with their token limits and descriptions

### Context Settings

The node provides the following context settings:

#### Knowledge Sources
- **Use Knowledge Base**: Access company knowledge base for information
- **Use Search Engine**: Allow searching the web for information
- **Use Websites**: Allow accessing and reading websites
- **Use News**: Allow searching news for recent information
- **Use Image Analysis**: Enable image analysis capabilities

#### Memory Settings
- **Use Short-Term Memory**: Recall information from the current conversation
- **Use Long-Term Memory**: Access information from past conversations
- **Memory Scope**: Set the scope for long-term memory (Chat, Company-wide, Global)

#### Context Types
- **Use Company Context**: Include company information in responses
- **Use Employee Persona**: Maintain the employee's persona in responses

#### Advanced Settings
- **Strategy**: Choose between One Shot and Chain of Thought reasoning
- **Temperature**: Control the randomness of AI responses (0-1)

These settings correspond to the ContextSettings in the Parallel AI backend, allowing full control over the AI's behavior directly from n8n workflows.