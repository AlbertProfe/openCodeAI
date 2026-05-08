# Testing: 2 approaches

## 1. Agent-Based Approach (WebMCP + Chrome DevTools MCP)

- [openCodeAI/docs/mcp/agent-flight-demo-tester/agents/flight-demo-agent.md at master · AlbertProfe/openCodeAI · GitHub](https://github.com/AlbertProfe/openCodeAI/blob/master/docs/mcp/agent-flight-demo-tester/agents/flight-demo-agent.md)

> This is the **native, structured, and recommended** method for AI agents in this setup. It uses **WebMCP** (Web Model Context Protocol) and the **Chrome DevTools MCP** server.

#### How it works:

- The demo page (`https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/`) is built to **expose structured tools** (e.g., `searchFlights`) directly to AI agents via WebMCP.
- The **Chrome DevTools MCP** server (running via `npx chrome-devtools-mcp`) gives the agent low-level control over a real Chrome instance: opening tabs, inspecting the DOM/structure, filling fields by **UID**, clicking buttons, etc.
- An <mark>orchestrating agent</mark> (l*ike the one described with sub-agents: analyzer, planner, coder, reviewer*) coordinates everything step-by-step.

#### Key Steps

1. Open the page with `chrome-devtools_new_page`.
2. Take a snapshot (`chrome-devtools_take_snapshot`) → This reveals **stable UIDs** for elements (e.g., `1_4` for Origin, `1_6` for Destination, search button `1_20`).
3. Fill fields using `chrome-devtools_fill` with exact UIDs.
4. Click Search with `chrome-devtools_click`.
5. Wait and take another snapshot to read results.

#### Advantages:

- **Deterministic & reliable** — Uses stable UIDs and structured tools instead of fragile selectors.
- **Agent-native** — Designed for AI orchestration (planner → coder → reviewer workflow).
- Leverages WebMCP when the page exposes high-level tools like `searchFlights` directly.
- Works with the testing flag in Chrome 144+.

#### Disadvantages:

- Requires setup (Chrome flag, MCP server in `opencode.json`, Node.js).
- More moving parts (MCP server, agent coordination).

This approach is ideal for **production-grade agent testing** and showcases the future of browser-AI integration.

## 2. Puppeteer Approach (Direct Browser Automation Script)

- [openCodeAI/mcp-test/flight-search.mjs at master · AlbertProfe/openCodeAI · GitHub](https://github.com/AlbertProfe/openCodeAI/blob/master/mcp-test/flight-search.mjs)

> This is the **traditional scripting** method using **Puppeteer** (headless Chrome control library).

#### How it works:

> The  script connects to an existing Chrome instance (via DevTools Protocol on port 9222), navigates to the page, finds elements by heuristics (labels, placeholders, text content), fills them, clicks Search, waits, and extracts results.

**Core logic from your script**:

- Connect to running Chrome: `chromium.connect({ browserURL: 'http://127.0.0.1:9222' })`
- Find inputs by checking nearby labels/placeholders.
- Type into Origin (`BCN`), Destination (`RIO`), Passengers (`2`).
- Find and click the button containing "Search".
- Wait 3 seconds and scrape visible text (especially elements with flight-related classes).

#### Advantages:

- **Simpler for one-off scripts** — No need for MCP servers or UID-based interaction.
- Very flexible — you can run arbitrary JavaScript via `page.evaluate()`.
- Good for quick validation or when you don’t have the full agent/MCP stack ready.
- Easy to extend (screenshots, full HTML dump, etc.).

#### Disadvantages:

- **Brittle** — Relies on DOM structure, text matching, and selectors that can break with UI changes.
- Less “intelligent” — the script has to implement its own element detection logic.
- No native benefit from WebMCP structured tools.
- Requires a running Chrome with remote debugging enabled.

### Comparison Summary

| Aspect               | Agent + Chrome DevTools MCP                 | Puppeteer Script                       |
| -------------------- | ------------------------------------------- | -------------------------------------- |
| **Reliability**      | High (UIDs + structured tools)              | Medium (selectors & text matching)     |
| **Setup Complexity** | Higher (MCP server, flags, agent framework) | Lower (just Node + Puppeteer)          |
| **Best For**         | AI agent orchestration & WebMCP demos       | Quick scripts & traditional automation |
| **Use of WebMCP**    | Full (structured tools + snapshots)         | None (raw DOM manipulation)            |
| **Maintainability**  | Better (stable UIDs)                        | Can degrade with UI changes            |
| **Intelligence**     | High (sub-agents, planning, reviewing)      | Low (hardcoded logic)                  |

### Recommendation for Testing

- Use the **Agent + MCP approach** for the full WebMCP demo experience — it’s what the demo was built for.
- Keep the **Puppeteer script** as a fast backup or for environments where MCP isn’t configured.
