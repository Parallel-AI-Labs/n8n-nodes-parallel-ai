#!/usr/bin/env node
/**
 * Regenerates nodes/ParallelAi/api-catalog.json from the Parallel AI OpenAPI spec.
 *
 * The node ships a static snapshot of the API catalog (resources, operations
 * and parameters) instead of fetching the spec at runtime. Run this script,
 * review the diff, bump the package version and publish to pick up API changes:
 *
 *   npm run sync-api-catalog
 *
 * Usage: node scripts/sync-api-catalog.js [spec-url-or-path]
 */
const fs = require("fs");
const path = require("path");

const DEFAULT_SPEC_URL = "https://api.parallellabs.app/docs/openapi.json";
const OUTPUT_FILE = path.resolve(__dirname, "..", "nodes", "ParallelAi", "api-catalog.json");
const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

const log = (msg) => process.stdout.write(`${msg}\n`);

const camelize = (str) =>
  str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, c) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());

const titleize = (camel) =>
  camel.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const firstLine = (text) => (typeof text === "string" ? text.split("\n")[0].trim() : "");

function mapKind(schema) {
  const type = schema.type;
  if (type === "boolean") return { kind: "boolean" };
  if (type === "integer" || type === "number") return { kind: "number" };
  if (type === "object" || type === "array") return { kind: "json" };
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return {
      kind: "string",
      enumOptions: schema.enum.map((v) => ({ name: titleize(camelize(String(v))), value: v })),
    };
  }
  return { kind: "string" };
}

function parseSpec(spec) {
  const resources = new Map();
  const paths = spec.paths || {};

  for (const [rawPath, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method)) continue;

      const tag = (op.tags && op.tags[0]) || "Other";
      const resourceValue = camelize(tag);
      if (!resources.has(resourceValue)) {
        resources.set(resourceValue, { value: resourceValue, name: tag, operations: [] });
      }
      const resource = resources.get(resourceValue);

      // e.g. employees_chatEmployee -> chatEmployee
      const opId = String(op.operationId || `${method}_${rawPath}`);
      let opValue = camelize(opId.includes("_") ? opId.split("_").slice(1).join("_") : opId);
      if (resource.operations.some((o) => o.value === opValue)) {
        opValue = `${opValue}${method.charAt(0).toUpperCase()}${method.slice(1)}`;
      }

      const params = [];
      const taken = new Set();

      for (const prm of op.parameters || []) {
        const location = prm.in;
        if (location !== "path" && location !== "query") continue;
        const { kind, enumOptions } = mapKind(prm.schema || {});
        const name = String(prm.name);
        taken.add(name);
        params.push({
          id: name,
          apiName: name,
          location,
          kind,
          required: location === "path" ? true : !!prm.required,
          description: firstLine(prm.description),
          ...(enumOptions ? { enumOptions } : {}),
        });
      }

      const content = op.requestBody && op.requestBody.content;
      const jsonContent = content && content["application/json"];
      const bodySchema = jsonContent && jsonContent.schema;
      if (bodySchema && bodySchema.properties) {
        const requiredSet = new Set(bodySchema.required || []);
        for (const [propName, propSchema] of Object.entries(bodySchema.properties)) {
          const { kind, enumOptions } = mapKind(propSchema);
          params.push({
            id: taken.has(propName) ? `body_${propName}` : propName,
            apiName: propName,
            location: "body",
            kind,
            required: requiredSet.has(propName),
            description: firstLine(propSchema.description),
            ...(enumOptions ? { enumOptions } : {}),
          });
        }
      }

      resource.operations.push({
        value: opValue,
        displayName: titleize(opValue),
        description: firstLine(op.description),
        method: method.toUpperCase(),
        path: rawPath,
        params,
      });
    }
  }

  const sorted = [...resources.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const resource of sorted) {
    resource.operations.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  return sorted;
}

async function loadSpec(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  return JSON.parse(fs.readFileSync(source, "utf8"));
}

async function main() {
  const source = process.argv[2] || DEFAULT_SPEC_URL;
  log(`Loading OpenAPI spec from ${source}`);
  const spec = await loadSpec(source);
  const resources = parseSpec(spec);
  const operationCount = resources.reduce((n, r) => n + r.operations.length, 0);

  const catalog = {
    source: DEFAULT_SPEC_URL,
    specVersion: (spec.info && spec.info.version) || "",
    generatedAt: new Date().toISOString().slice(0, 10),
    resourceCount: resources.length,
    operationCount,
    resources,
  };

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  log(
    `Wrote ${path.relative(process.cwd(), OUTPUT_FILE)}: ${resources.length} resources, ${operationCount} operations`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
