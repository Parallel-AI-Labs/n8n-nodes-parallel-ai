import type { ILoadOptionsFunctions, INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData } from "n8n-workflow";
export declare class ParallelAiChatModel implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            parallelAiModelSearch(this: ILoadOptionsFunctions): Promise<{
                results: {
                    name: string;
                    value: any;
                }[];
            }>;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
