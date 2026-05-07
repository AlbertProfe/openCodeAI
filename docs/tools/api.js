import { tool } from "@opencode-ai/plugin";
import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const BASE_URL = "http://localhost:8080/api/v1";
const RESPONSE_DIR = "apiResponses";

const ENDPOINTS = {
  apartment: {
    base: `${BASE_URL}/apartment`,
    getAll: `${BASE_URL}/apartment/getAll`,
    getById: (id) => `${BASE_URL}/apartment/getById?id=${id}`,
    create: `${BASE_URL}/apartment/create`,
    update: `${BASE_URL}/apartment/update`,
    deleteById: (id) => `${BASE_URL}/apartment/deleteById?id=${id}`,
    filter: `${BASE_URL}/apartment/filter`,
  },
  school: {
    base: `${BASE_URL}/school`,
    getAll: `${BASE_URL}/school/getAll`,
    getById: (id) => `${BASE_URL}/school/getById?id=${id}`,
    create: `${BASE_URL}/school/create`,
    update: `${BASE_URL}/school/update`,
    deleteById: (id) => `${BASE_URL}/school/deleteById?id=${id}`,
    filter: `${BASE_URL}/school/filter`,
  },
  reviewer: {
    base: `${BASE_URL}/reviewer`,
    getAll: `${BASE_URL}/reviewer/getAll`,
    getById: (id) => `${BASE_URL}/reviewer/getById?id=${id}`,
    create: `${BASE_URL}/reviewer/create`,
    update: `${BASE_URL}/reviewer/update`,
    deleteById: (id) => `${BASE_URL}/reviewer/deleteById?id=${id}`,
  },
  owner: {
    base: `${BASE_URL}/owner`,
    getAll: `${BASE_URL}/owner/getAll`,
    getById: (id) => `${BASE_URL}/owner/getById?id=${id}`,
    create: `${BASE_URL}/owner/create`,
    update: `${BASE_URL}/owner/update`,
    deleteById: (id) => `${BASE_URL}/owner/deleteById?id=${id}`,
  },
};

function buildUrl(entity, operation, args) {
  const api = ENDPOINTS[entity];
  if (!api) throw new Error(`Unknown entity: ${entity}`);

  switch (operation) {
    case "getAll":
      return api.getAll;
    case "getById":
      if (!args.id) throw new Error("id is required for getById");
      return api.getById(args.id);
    case "create":
      return api.create;
    case "update":
      return api.update;
    case "delete":
      if (!args.id) throw new Error("id is required for delete");
      return api.deleteById(args.id);
    case "filter":
      return api.filter;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

function buildQueryString(queryParams) {
  if (!queryParams) return "";

  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function runCurl({ method, url, headers, body }) {
  const args = ["curl", "-sS", "-X", method, "-H", "Content-Type: application/json"];

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        args.push("-H", `${key}: ${value}`);
      }
    });
  }

  if (body !== undefined) {
    args.push("-d", JSON.stringify(body));
  }

  args.push(url);

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    const proc = spawn("curl", args);

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    proc.on("error", (err) => {
      stderr = err.message;
      exitCode = 1;
      resolve({ stdout, stderr, exitCode });
    });
  });
}

async function saveResponse({ entity, operation, parsed, raw }) {
  await mkdir(RESPONSE_DIR, { recursive: true });

  const payload = parsed ?? { rawResponse: raw };
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${entity}-${operation}-${timestamp}.json`;
  const filePath = path.resolve(RESPONSE_DIR, fileName);
  const latestPath = path.resolve(RESPONSE_DIR, "latest.json");

  await writeFile(filePath, JSON.stringify(payload, null, 2));
  await writeFile(latestPath, JSON.stringify(payload, null, 2));

  try {
    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    spawn(opener, [filePath]);
  } catch {
    // Ignore open failures; file is still saved.
  }

  return latestPath;
}

export const apiTool = tool({
  description:
    "Test apartment, school, reviewer, and owner REST endpoints with curl. Usage: entity=apartment operation=getAll id=optional body=optional queryParams=optional",
  args: {
    entity: tool.schema.string().describe("Entity: apartment|school|reviewer|owner"),
    operation: tool.schema.string().describe("Operation: getAll|getById|create|update|delete|filter"),
    id: tool.schema.string().optional().describe("Resource ID"),
    body: tool.schema.string().optional().describe("JSON body for create/update"),
    queryParams: tool.schema.string().optional().describe("JSON query params"),
  },
  async execute(args) {
    const entity = args.entity;
    const operation = args.operation;
    const id = args.id;
    const body = args.body ? JSON.parse(args.body) : undefined;
    const queryParams = args.queryParams ? JSON.parse(args.queryParams) : undefined;
    const url = buildUrl(entity, operation, { id }) + buildQueryString(queryParams);
    const method =
      args.operation === "getAll" || args.operation === "getById" || args.operation === "filter"
        ? "GET"
        : args.operation === "create"
          ? "POST"
          : args.operation === "update"
            ? "POST"
            : "DELETE";

    const { stdout, stderr, exitCode } = await runCurl({
      method,
      url,
      body: body,
    });

    try {
      const parsed = JSON.parse(stdout);
      const responseFile = await saveResponse({
        entity,
        operation,
        parsed,
      });

      return JSON.stringify({
        success: exitCode === 0,
        entity,
        operation,
        method,
        url,
        response: parsed,
        responseFile,
      }, null, 2);
    } catch {
      const responseFile = await saveResponse({
        entity,
        operation,
        raw: stdout,
      });

      return JSON.stringify({
        success: exitCode === 0,
        entity,
        operation,
        method,
        url,
        rawResponse: stdout,
        responseFile,
        stderr: stderr || undefined,
      }, null, 2);
    }
  },
});
