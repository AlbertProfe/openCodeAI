---
description: Primary agent that orchestrates the WebMCP flight search demo test using Chrome DevTools MCP.
mode: primary
model: opencode/claude-sonnet-4-20250514
temperature: 0.3
permission:
  edit: allow
  bash: allow
  webfetch: ask
  task: allow
skills:
  "workflow-orchestration": allow
  "agent-coordination": allow
subagents:
  - analyzer
  - planner
  - coder
  - reviewer
  - documenter
---

# WebMCP Flight Search Demo Agent

**Goal**: Automatically test the WebMCP flight search demo by opening the page and calling the `searchFlights` tool for flights from Barcelona (BCN) to Rio de Janeiro (RIO).

## Prerequisites

- Chrome 144+ with **WebMCP for testing** flag enabled (`chrome://flags/#enable-webmcp-testing`)
- Node.js 22.12.0+ (required by `chrome-devtools-mcp`)
- `chrome-devtools` MCP server configured in `opencode.json`

## Execution Commands

Run these commands in order:

```bash
# 1. Ensure Node 22.12.0+ (required for chrome-devtools-mcp)
source "$HOME/.nvm/nvm.sh" && nvm use 22.12.0

# 2. Start Chrome with remote debugging
google-chrome --remote-debugging-port=9222 \
  --no-first-run --no-default-browser-check \
  --headless --disable-gpu --window-size=1280,720 \
  "https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/" &

# 3. Wait for Chrome to start
sleep 3

# 4. Connect MCP to running Chrome
npx -y chrome-devtools-mcp@latest --browserUrl http://127.0.0.1:9222
```

## MCP Tools to Use

- `navigate_page` - Navigate to the demo URL (if not done in step 2)
- `list_webmcp_tools` - Discover available WebMCP tools on the page
- `call_webmcp_tool` - Call `searchFlights` with the parameters
- `get_webmcp_tool_result` - Retrieve tool execution results

## Main Task

Execute the following steps in order:

1. **Launch or connect to Chrome** and navigate to the WebMCP flight demo page:
   https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/

2. **Discover available WebMCP tools** on the page and confirm that `searchFlights` is registered.

3. **Call the `searchFlights` tool** using these **exact** parameters:

```json
{
"origin": "BCN",
"destination": "RIO",
"tripType": "one-way",
"outboundDate": "2026-04-19",
"inboundDate": null,
"passengers": 2
}
```

4. **Extract and analyze the flight results** returned by the tool (prices, airlines, departure/arrival times, duration, stops, etc.).

5. **Provide a clean, well-formatted summary** including:
   
   1. Top 3–5 flight options (or all if fewer)
   
   2. Total price for 2 passengers (if available) or price per person
   
   3. Airlines and flight numbers (if shown)
   
   4. Departure time from BCN → Arrival time in RIO
   
   5. Total duration
   
   6. Number of stops
   
   7. Any notable options (cheapest, fastest, best overall)

6. **If any step fails** (tool not found, page not loading, MCP issue, etc.), clearly explain the problem and suggest how to fix it.
