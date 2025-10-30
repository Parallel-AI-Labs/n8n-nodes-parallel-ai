import { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions, INodeType, INodeTypeDescription } from "n8n-workflow";
export declare class BrowserTask implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getBrowserIntegrations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
