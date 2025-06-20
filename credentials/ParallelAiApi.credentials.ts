import {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class ParallelAiApi implements ICredentialType {
  name = "parallelAiApi";
  displayName = "Parallel AI API";
  icon: Icon = "file:logo.png";
  documentationUrl = "https://api.parallellabs.app/docs";
  properties: INodeProperties[] = [
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

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "X-API-KEY": "={{$credentials.apiKey}}",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.apiUrl}}",
      url: "/models",
    },
  };
}
