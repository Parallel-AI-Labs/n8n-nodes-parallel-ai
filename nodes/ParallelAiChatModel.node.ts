/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import { ChatOpenAI, type OpenAIChatInput } from "@langchain/openai";
import type {
  ILoadOptionsFunctions,
  INodeType,
  INodeTypeDescription,
  ISupplyDataFunctions,
  SupplyData,
} from "n8n-workflow";
import { NodeConnectionType } from "n8n-workflow";

import { makeN8nLlmFailedAttemptHandler } from "./n8nLlmFailedAttemptHandler";
import { N8nLlmTracing } from "./N8nLlmTracing";

export class ParallelAiChatModel implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Parallel AI Model",
    // eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
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
    // eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
    inputs: [],
    // eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
    // eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
    outputs: [NodeConnectionType.AiLanguageModel],
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
        description:
          'The model which will generate the completion. <a href="https://docs.parallellabs.app/">Learn more</a>.',
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
            description:
              "Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
            type: "number",
          },
          {
            displayName: "Maximum Number of Tokens",
            name: "maxTokens",
            default: -1,
            description:
              "The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 32,768).",
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
            description:
              "Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
            type: "number",
          },
          {
            displayName: "Sampling Temperature",
            name: "temperature",
            default: 0.7,
            typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
            description:
              "Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.",
            type: "number",
          },
          {
            displayName: "Timeout",
            name: "timeout",
            default: 60000,
            description:
              "Maximum amount of time a request is allowed to take in milliseconds",
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
            description:
              "Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.",
            type: "number",
          },
        ],
      },
    ],
  };

  methods = {
    listSearch: {
      async parallelAiModelSearch(this: ILoadOptionsFunctions) {
        const results = [];
        const credentials = await this.getCredentials("parallelAiApi");
        const baseUrl = credentials.baseUrl as string;

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
        } catch (error) {
          // Return empty results if API call fails
          console.warn("Failed to fetch Parallel AI models:", error.message);
        }

        return { results };
      },
    },
  };

  async supplyData(
    this: ISupplyDataFunctions,
    itemIndex: number
  ): Promise<SupplyData> {
    const credentials = await this.getCredentials("parallelAiApi");

    const modelName = this.getNodeParameter("model", itemIndex, "", {
      extractValue: true,
    }) as string;

    const options = this.getNodeParameter("options", itemIndex, {}) as {
      frequencyPenalty?: number;
      maxTokens?: number;
      presencePenalty?: number;
      temperature?: number;
      timeout?: number;
      maxRetries?: number;
      topP?: number;
    };

    const configuration: OpenAIChatInput = {
      openAIApiKey: credentials.apiKey as string,
      modelName,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens === -1 ? undefined : options.maxTokens,
      topP: options.topP ?? 1,
      frequencyPenalty: options.frequencyPenalty ?? 0,
      presencePenalty: options.presencePenalty ?? 0,
      timeout: options.timeout ?? 60000,
      maxRetries: options.maxRetries ?? 2,
      configuration: {
        baseURL: (credentials.baseUrl as string) + "/api/v0",
      },
      callbacks: [new N8nLlmTracing(this)],
      onFailedAttempt: makeN8nLlmFailedAttemptHandler(this),
    };

    const model = new ChatOpenAI(configuration);

    return {
      response: model,
    };
  }
}
