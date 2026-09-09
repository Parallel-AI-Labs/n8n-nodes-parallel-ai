import { INodePropertyOptions } from "n8n-workflow";

import apiCatalog from "./api-catalog.json";

/**
 * Static API catalog for the "API (Any Operation)" resource.
 *
 * `api-catalog.json` is a snapshot of the Parallel AI OpenAPI spec, pre-parsed
 * into resources, operations and parameters. It is bundled with the package
 * (nothing is fetched at runtime) and regenerated with `npm run sync-api-catalog`
 * before a release to pick up API changes.
 */

export type ParamKind = "string" | "number" | "boolean" | "json";
export type ParamLocation = "path" | "query" | "body";

export interface OperationParam {
  /** Unique field id within the operation (body fields that shadow a path/query param are prefixed). */
  id: string;
  /** Name of the parameter as the API expects it. */
  apiName: string;
  location: ParamLocation;
  kind: ParamKind;
  required: boolean;
  description: string;
  enumOptions?: INodePropertyOptions[];
}

export interface OperationDef {
  value: string;
  displayName: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  params: OperationParam[];
}

export interface ResourceDef {
  value: string;
  name: string;
  operations: OperationDef[];
}

interface ApiCatalog {
  source: string;
  specVersion: string;
  generatedAt: string;
  resourceCount: number;
  operationCount: number;
  resources: ResourceDef[];
}

const catalog = apiCatalog as unknown as ApiCatalog;

export function getCatalog(): ResourceDef[] {
  return catalog.resources;
}

export function findOperation(
  resources: ResourceDef[],
  resourceValue: string,
  operationValue: string
): OperationDef | undefined {
  const resource = resources.find((r) => r.value === resourceValue);
  return resource?.operations.find((o) => o.value === operationValue);
}
