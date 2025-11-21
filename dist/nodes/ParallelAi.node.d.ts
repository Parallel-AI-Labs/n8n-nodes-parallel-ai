import { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions, INodeType, INodeTypeDescription } from "n8n-workflow";
export declare class ParallelAi implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getImageModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getVideoModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getBrowserIntegrations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getEmployees(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
