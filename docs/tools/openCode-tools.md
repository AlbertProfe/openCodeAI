# Tools

- [Tools | OpenCode](https://opencode.ai/docs/tools)

Tools allow the LLM to perform actions in your codebase. OpenCode comes with a set of built-in tools, but you can extend it with [custom tools](https://opencode.ai/docs/custom-tools) or [MCP servers](https://opencode.ai/docs/mcp-servers).

By default, all tools are **enabled** and don’t need permission to run. You can control tool behavior through [permissions](https://opencode.ai/docs/permissions).

## Example:

`Simple Command`

```jsx
// .opencode/tools/hello.ts
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Say hello",
  args: {
    name: tool.schema.string().describe("Your name"),
  },
  async execute(args) {
    return { greeting: `Hello, ${args.name}!` };
  },
});
```

Usage: `/hello name=World`

## **Tool Name:** API Tester

### (REST Client for Backend Entities)

Key Points

1. **Location**: Files in `.opencode/tools/*.ts` are auto-discovered
2. **Filename** = command name (e.g., `api.ts` → `/api`)
3. **Schema types**: `enum()`, `string()`, `object()`, `boolean()`, `number()`
4. **All optional**: add `.optional()` to any param
5. **Return value**: object that becomes the tool's output

**Description:**  

> A powerful local testing tool that allows you to easily call and test CRUD endpoints for four main backend entities (`apartment`, `school`, `reviewer`, `owner`) using curl under the hood. It automatically saves responses as nicely formatted JSON files and opens them.

### **Core Features**

- **Entities Supported**: `apartment`, `school`, `reviewer`, `owner`
- **Operations Supported**: `getAll`, `getById`, `create`, `update`, `delete`, `filter`
- Automatically builds correct URLs and HTTP methods
- Runs real `curl` commands via Bun
- Saves every response as a timestamped JSON file in `apiResponses/` folder
- Also overwrites `latest.json` for quick access
- Attempts to auto-open the response file (macOS/Linux)

---

### **Arguments**

| Argument      | Type   | Required | Description                                                           |
| ------------- | ------ | -------- | --------------------------------------------------------------------- |
| `entity`      | enum   | Yes      | `apartment` \| `school` \| `reviewer` \| `owner`                      |
| `operation`   | enum   | Yes      | `getAll` \| `getById` \| `create` \| `update` \| `delete` \| `filter` |
| `id`          | string | Optional | Required for `getById` and `delete`                                   |
| `body`        | object | Optional | Request body (for `create` / `update`)                                |
| `queryParams` | object | Optional | Query parameters (mainly for `filter`)                                |
| `headers`     | object | Optional | Extra HTTP headers                                                    |

---

### **Example Usage**

```js
// Get all apartments
{ entity: "apartment", operation: "getAll" }

// Get specific school
{ entity: "school", operation: "getById", id: "123" }

// Create new reviewer
{ 
  entity: "reviewer", 
  operation: "create", 
  body: { name: "John Doe", email: "john@example.com" }
}

// Filter apartments
{ 
  entity: "apartment", 
  operation: "filter", 
  queryParams: { minPrice: 50000, city: "Berlin" }
}
```

### **Output**

Returns rich information including:

- Success status
- Full URL and method used
- Parsed JSON response (or raw)
- Path to saved JSON file
- `latest.json` location

**Best Use Case**: Rapid testing and debugging of your local backend (`http://localhost:8080`) during development. Very useful for OpenCode/AI coding agents.

```tsx
import { tool } from "@opencode-ai/plugin";
import { mkdir } from "node:fs/promises";
import path from "node:path";

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

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

async function saveResponse({ entity, operation, parsed, raw }) {
  await mkdir(RESPONSE_DIR, { recursive: true });

  const payload = parsed ?? { rawResponse: raw };
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${entity}-${operation}-${timestamp}.json`;
  const filePath = path.resolve(RESPONSE_DIR, fileName);
  const latestPath = path.resolve(RESPONSE_DIR, "latest.json");

  await Bun.write(filePath, JSON.stringify(payload, null, 2));
  await Bun.write(latestPath, JSON.stringify(payload, null, 2));

  try {
    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    const proc = Bun.spawn([opener, filePath], { stdout: "pipe", stderr: "pipe" });
    await proc.exited;
  } catch {
    // Ignore open failures; file is still saved.
  }

  return latestPath;
}

export default tool({
  description:
    "Test apartment, school, reviewer, and owner REST endpoints with curl using the phase-0 endpoint map.",
  args: {
    entity: tool.schema
      .enum(["apartment", "school", "reviewer", "owner"])
      .describe("Which backend entity to call"),
    operation: tool.schema
      .enum(["getAll", "getById", "create", "update", "delete", "filter"])
      .describe("Which CRUD endpoint to call"),
    id: tool.schema.string().optional().describe("Resource ID for getById/delete"),
    body: tool.schema.object().optional().describe("Request body for create/update"),
    queryParams: tool.schema.object().optional().describe("Query parameters for filter requests"),
    headers: tool.schema.object().optional().describe("Extra HTTP headers"),
  },
  async execute(args) {
    const url = buildUrl(args.entity, args.operation, args) + buildQueryString(args.queryParams);
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
      headers: args.headers,
      body: args.body,
    });

    try {
      const parsed = JSON.parse(stdout);
      const responseFile = await saveResponse({
        entity: args.entity,
        operation: args.operation,
        parsed,
      });

      return {
        success: exitCode === 0,
        entity: args.entity,
        operation: args.operation,
        method,
        url,
        response: parsed,
        prettyResponse: JSON.stringify(parsed, null, 2),
        responseFile,
        openFile: `Open this file: ${responseFile}`,
        openHint: responseFile,
        stderr: stderr || undefined,
      };
    } catch {
      const responseFile = await saveResponse({
        entity: args.entity,
        operation: args.operation,
        raw: stdout,
      });

      return {
        success: exitCode === 0,
        entity: args.entity,
        operation: args.operation,
        method,
        url,
        rawResponse: stdout,
        responseFile,
        openFile: `Open this file: ${responseFile}`,
        openHint: responseFile,
        stderr: stderr || undefined,
      };
    }
  },
});
```

## Bug

The OpenCode tool system has a bug with the `_.split` error. This appears to be an issue with how OpenCode parses tool arguments internally, not with your code.

**Workaround**: Use curl directly:

```
curl -s "http://localhost:8080/api/v1/apartment/getAll" | head -c 2000
```
