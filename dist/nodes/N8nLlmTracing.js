"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nLlmTracing = void 0;
const base_1 = require("@langchain/core/callbacks/base");
class N8nLlmTracing extends base_1.BaseCallbackHandler {
    constructor(ctx) {
        super();
        this.ctx = ctx;
    }
    async handleLLMStart(llm, prompts) {
        this.ctx.logger.debug('LLM request started', { prompts });
    }
    async handleLLMEnd(output) {
        this.ctx.logger.debug('LLM request completed', { output });
    }
    async handleLLMError(error) {
        this.ctx.logger.error('LLM request failed', { error: error.message });
    }
}
exports.N8nLlmTracing = N8nLlmTracing;
//# sourceMappingURL=N8nLlmTracing.js.map