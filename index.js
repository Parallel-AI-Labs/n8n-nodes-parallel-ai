module.exports = {
  nodes: [
    // Unified node (new approach)
    require("./nodes/ParallelAi.node.js"),
    // Knowledge base retriever node for AI Agent support
    require("./nodes/KnowledgeBaseRetriever.node.js"),
  ],
  credentials: [require("./credentials/ParallelAiApi.credentials.js")],
};
