module.exports = {
	nodes: [
		// Unified node (new approach)
		require('./nodes/ParallelAi.node.js'),
		// Chat model node for AI Agent language model support
		require('./nodes/ParallelAiChatModel.node.js'),
		// Knowledge base retriever node for AI Agent support
		require('./nodes/KnowledgeBaseRetriever.node.js'),
	],
	credentials: [
		require('./credentials/ParallelAiApi.credentials.js'),
	],
};