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

**Use Chrome DevTools MCP directly** (no need for manual Chrome startup):

1. The MCP server handles Chrome automatically - just navigate and interact
2. Use the built-in MCP tools to fill forms and click buttons

## MCP Tools to Use (via OpenCode)

- `chrome-devtools_new_page` - Open a new tab with the URL
- `chrome-devtools_take_snapshot` - Get page snapshot/structure
- `chrome-devtools_fill` - Fill form fields (uid, value)
- `chrome-devtools_click` - Click buttons/links (uid)
- `chrome-devtools_evaluate_script` - Run JavaScript if needed

## Find Element UIDs

Run `chrome-devtools_take_snapshot` first to get element UIDs, then use:

- Fill: `chrome-devtools_fill uid="1_4" value="BCN"`
- Click: `chrome-devtools_click uid="1_20"`

## Main Task

Execute the following steps in order:

1. **Open the flight demo page** using:
   
   ```
   chrome-devtools_new_page url="https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/"
   ```

2. **Get page structure** to find form UIDs:
   
   ```
   chrome-devtools_take_snapshot
   ```
   
   Look for the Origin combobox (uid like `1_4`), Destination (`1_6`), Passengers (`1_19`), and Search button (`1_20`)

3. **Fill in the search form**:
   
   ```
   chrome-devtools_fill uid="<origin_uid>" value="BCN"
   chrome-devtools_fill uid="<destination_uid>" value="RIO"
   chrome-devtools_fill uid="<passengers_uid>" value="2"
   ```

4. **Click the Search button**:
   
   ```
   chrome-devtools_click uid="<search_button_uid>"
   ```

5. **Wait for results** (2-3 seconds), then get the results:
   
   ```
   chrome-devtools_take_snapshot
   ```

6. **Parse and summarize** the flight results from the snapshot.
