"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelAiApi = void 0;
class ParallelAiApi {
    constructor() {
        this.name = "parallelAiApi";
        this.displayName = "Parallel AI API";
        this.icon = "file:logo.png";
        this.documentationUrl = "https://api.parallellabs.app/docs";
        this.properties = [
            {
                displayName: "API Key",
                name: "apiKey",
                type: "string",
                typeOptions: { password: true },
                default: "",
                description: "API key for authentication (sent as X-API-KEY header)",
            },
            {
                displayName: "Base URL",
                name: "baseUrl",
                type: "string",
                default: "https://api.parallellabs.app",
                description: "Base URL of your Parallel AI API instance",
            },
        ];
        this.authenticate = {
            type: "generic",
            properties: {
                headers: {
                    "X-API-KEY": "={{$credentials.apiKey}}",
                },
            },
        };
        this.test = {
            request: {
                baseURL: "={{$credentials.apiUrl}}",
                url: "/models",
            },
        };
    }
}
exports.ParallelAiApi = ParallelAiApi;
//# sourceMappingURL=ParallelAiApi.credentials.js.map