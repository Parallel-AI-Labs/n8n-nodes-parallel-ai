import { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeListSearchResult, INodeType, INodeTypeDescription } from "n8n-workflow";
export declare class BrowserTask implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            searchBrowserIntegrations(this: ILoadOptionsFunctions): Promise<INodeListSearchResult>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
