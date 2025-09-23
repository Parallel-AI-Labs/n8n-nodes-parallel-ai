import type { ISupplyDataFunctions } from 'n8n-workflow';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
export declare class N8nLlmTracing extends BaseCallbackHandler {
    private ctx;
    constructor(ctx: ISupplyDataFunctions);
    handleLLMStart(llm: any, prompts: string[]): Promise<void>;
    handleLLMEnd(output: any): Promise<void>;
    handleLLMError(error: Error): Promise<void>;
}
