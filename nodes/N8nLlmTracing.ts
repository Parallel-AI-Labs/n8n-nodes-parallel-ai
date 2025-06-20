import type { ISupplyDataFunctions } from 'n8n-workflow';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

export class N8nLlmTracing extends BaseCallbackHandler {
    constructor(private ctx: ISupplyDataFunctions) {
        super();
    }

    async handleLLMStart(llm: any, prompts: string[]) {
        this.ctx.logger.debug('LLM request started', { prompts });
    }

    async handleLLMEnd(output: any) {
        this.ctx.logger.debug('LLM request completed', { output });
    }

    async handleLLMError(error: Error) {
        this.ctx.logger.error('LLM request failed', { error: error.message });
    }
}