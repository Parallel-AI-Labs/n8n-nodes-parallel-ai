"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelAiChatModel = void 0;
const openai_1 = require("@langchain/openai");
const n8nLlmFailedAttemptHandler_1 = require("./n8nLlmFailedAttemptHandler");
const N8nLlmTracing_1 = require("./N8nLlmTracing");
class ParallelAiChatModel {
    constructor() {
        this.description = {
            displayName: "Parallel AI Model",
            name: "parallelAiChatModel",
            hidden: true,
            icon: "file:logo.png",
            group: ["transform"],
            version: 1,
            description: "For advanced usage with an AI chain",
            defaults: {
                name: "Parallel AI Model",
            },
            codex: {
                categories: ["AI"],
                subcategories: {
                    AI: ["Language Models", "Root Nodes"],
                    "Language Models": [
                        "Chat Models (Recommended)",
                        "Text Completion Models",
                    ],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: "https://docs.parallellabs.app/",
                        },
                    ],
                },
            },
            inputs: [],
            outputs: ["ai_languageModel"],
            outputNames: ["Model"],
            credentials: [
                {
                    name: "parallelAiApi",
                    required: true,
                },
            ],
            requestDefaults: {
                ignoreHttpStatusErrors: true,
                baseURL: '={{ $credentials.baseUrl || "https://api.parallellabs.app" }}',
            },
            properties: [
                {
                    displayName: "Model",
                    name: "model",
                    type: "resourceLocator",
                    default: { mode: "list", value: "" },
                    required: true,
                    description: 'The model which will generate the completion. <a href="https://docs.parallellabs.app/">Learn more</a>.',
                    modes: [
                        {
                            displayName: "From List",
                            name: "list",
                            type: "list",
                            typeOptions: {
                                searchListMethod: "parallelAiModelSearch",
                            },
                        },
                        {
                            displayName: "ID",
                            name: "id",
                            type: "string",
                        },
                    ],
                    routing: {
                        send: {
                            type: "body",
                            property: "model",
                            value: "={{$parameter.model.value}}",
                        },
                    },
                },
                {
                    displayName: "Options",
                    name: "options",
                    placeholder: "Add Option",
                    description: "Additional options to add",
                    type: "collection",
                    default: {},
                    options: [
                        {
                            displayName: "Frequency Penalty",
                            name: "frequencyPenalty",
                            default: 0,
                            typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
                            description: "Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
                            type: "number",
                        },
                        {
                            displayName: "Maximum Number of Tokens",
                            name: "maxTokens",
                            default: -1,
                            description: "The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 32,768).",
                            type: "number",
                            typeOptions: {
                                maxValue: 32768,
                            },
                        },
                        {
                            displayName: "Presence Penalty",
                            name: "presencePenalty",
                            default: 0,
                            typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
                            description: "Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
                            type: "number",
                        },
                        {
                            displayName: "Sampling Temperature",
                            name: "temperature",
                            default: 0.7,
                            typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
                            description: "Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.",
                            type: "number",
                        },
                        {
                            displayName: "Timeout",
                            name: "timeout",
                            default: 60000,
                            description: "Maximum amount of time a request is allowed to take in milliseconds",
                            type: "number",
                        },
                        {
                            displayName: "Max Retries",
                            name: "maxRetries",
                            default: 2,
                            description: "Maximum number of retries to attempt",
                            type: "number",
                        },
                        {
                            displayName: "Top P",
                            name: "topP",
                            default: 1,
                            typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
                            description: "Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.",
                            type: "number",
                        },
                    ],
                },
            ],
        };
        this.methods = {
            listSearch: {
                async parallelAiModelSearch() {
                    const results = [];
                    const credentials = await this.getCredentials("parallelAiApi");
                    const baseUrl = credentials.baseUrl;
                    try {
                        const response = await this.helpers.request({
                            method: "GET",
                            url: `${baseUrl}/api/v0/models`,
                            headers: {
                                Authorization: `Bearer ${credentials.apiKey}`,
                            },
                            json: true,
                        });
                        for (const model of response.models || []) {
                            if (model.enabled) {
                                results.push({
                                    name: `${model.label} (${model.provider}) - ${model.credits} credits`,
                                    value: model.name,
                                });
                            }
                        }
                    }
                    catch (error) {
                        console.warn("Failed to fetch Parallel AI models:", error.message);
                    }
                    return { results };
                },
            },
        };
    }
    async supplyData(itemIndex) {
        var _a, _b, _c, _d, _e, _f;
        const credentials = await this.getCredentials("parallelAiApi");
        const modelName = this.getNodeParameter("model", itemIndex, "", {
            extractValue: true,
        });
        const options = this.getNodeParameter("options", itemIndex, {});
        const configuration = {
            openAIApiKey: credentials.apiKey,
            modelName,
            temperature: (_a = options.temperature) !== null && _a !== void 0 ? _a : 0.7,
            maxTokens: options.maxTokens === -1 ? undefined : options.maxTokens,
            topP: (_b = options.topP) !== null && _b !== void 0 ? _b : 1,
            frequencyPenalty: (_c = options.frequencyPenalty) !== null && _c !== void 0 ? _c : 0,
            presencePenalty: (_d = options.presencePenalty) !== null && _d !== void 0 ? _d : 0,
            timeout: (_e = options.timeout) !== null && _e !== void 0 ? _e : 60000,
            maxRetries: (_f = options.maxRetries) !== null && _f !== void 0 ? _f : 2,
            configuration: {
                baseURL: credentials.baseUrl + "/api/v0",
            },
            callbacks: [new N8nLlmTracing_1.N8nLlmTracing(this)],
            onFailedAttempt: (0, n8nLlmFailedAttemptHandler_1.makeN8nLlmFailedAttemptHandler)(this),
        };
        const model = new openai_1.ChatOpenAI(configuration);
        return {
            response: model,
        };
    }
}
exports.ParallelAiChatModel = ParallelAiChatModel;
//# sourceMappingURL=ParallelAiChatModel.node.js.map