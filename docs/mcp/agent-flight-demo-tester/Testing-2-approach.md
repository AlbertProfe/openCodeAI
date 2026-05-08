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

## Puppeteer Code

- [openCodeAI/mcp-test/flight-search.mjs at master · AlbertProfe/openCodeAI · GitHub](https://github.com/AlbertProfe/openCodeAI/blob/master/mcp-test/flight-search.mjs)
  
  - <mark>Older version:</mark> [openCodeAI/mcp-test/flight-search.cjs at master · AlbertProfe/openCodeAI · GitHub](https://github.com/AlbertProfe/openCodeAI/blob/master/mcp-test/flight-search.cjs)

## 1. **Import and Connect to Chrome**

```js
import { chromium } from 'puppeteer';

const browser = await chromium.connect({ browserURL: 'http://127.0.0.1:9222' });
```

- Uses **Puppeteer’s Chromium** module.
- **Connects** to an **already running** Chrome browser instead of launching a new one.
- Connects via the **DevTools Protocol** on port `9222` (Chrome must be started with remote debugging enabled).

## 2. **Get or Create a Page**

```js
const pages = await browser.pages();
const page = pages[0] || await browser.newPage();
```

- Gets all open tabs/pages in the connected Chrome.
- Uses the first tab if available, otherwise opens a new one.

## 3. **Navigate to the Flight Search Demo**

```js
await page.goto('https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/', { 
    waitUntil: 'networkidle0', 
    timeout: 30000 
});
```

- Opens the WebMCP flight search demo page.
- `waitUntil: 'networkidle0'` → waits until the network is idle (no requests for 500ms).
- `timeout: 30000` → gives 30 seconds to load.

## 4. **Fill the Search Form**

* Smart Input Detection)

```js
const inputs = await page.$$('input, combobox');

for (const input of inputs) {
  const label = await input.evaluate(el => {
    const prev = el.previousElementSibling;
    return prev?.textContent || el.getAttribute('placeholder') || el.getAttribute('name') || '';
  });

  if (label.toLowerCase().includes('origin')) { 
    await input.click(); 
    await input.type('BCN', { delay: 50 }); 
  }
  if (label.toLowerCase().includes('destination')) { 
    await input.click(); 
    await input.type('RIO', { delay: 50 }); 
  }
  if (label.toLowerCase().includes('passenger')) { 
    await input.click(); 
    await input.type('2', { delay: 50 }); 
  }
}
```

**How it works:**

- `page.$$('input, combobox')` → finds all input fields and comboboxes.
- For each input, it runs JavaScript in the browser (`evaluate`) to guess its label by:
  - Looking at the previous sibling element (often a `<label>`).
  - Or checking `placeholder` attribute.
  - Or checking `name` attribute.
- Then it matches keywords:
  - “origin” → types **BCN** (Barcelona)
  - “destination” → types **RIO** (Rio de Janeiro)
  - “passenger” → types **2**

The `{ delay: 50 }` makes typing more human-like.

## 5. **Click the Search Button**

```js
const buttons = await page.$$('button');

for (const btn of buttons) {
  const text = await btn.evaluate(el => el.textContent);
  if (text.toLowerCase().includes('search')) { 
    await btn.click(); 
    console.log('Clicked search'); 
  }
}
```

- Finds all `<button>` elements.
- Checks the visible text of each button.
- Clicks the one that contains the word **"search"**.

## 6. **Wait for Results**

```js
await page.waitForTimeout(3000);
```

- Waits 3 seconds for the search results to load and appear on the page.

## 7. **Extract and Print Results**

```js
const html = await page.content();  // Gets full HTML (not used here)

console.log('Page loaded, checking results...');

const results = await page.evaluate(() => {
  const els = document.querySelectorAll('button, statictext, [class*="flight"]');
  return Array.from(els).slice(0,30).map(e => e.textContent).join('\n');
});

console.log(results);
```

- `page.evaluate()` runs JavaScript directly in the browser page.
- Selects:
  - All buttons
  - Elements with tag `statictext` (possibly custom elements)
  - Any element whose class contains “flight”
- Takes the first 30 elements, extracts their text, and joins them with new lines.
- Prints the results to the console.

## 8. **Close the Browser**

```js
await browser.close();
```

Closes the connection (does **not** close the actual Chrome window if you connected to an existing one).

### Summary – What This Script Does:

1. Connects to running Chrome.
2. Opens the flight search demo.
3. Automatically fills: **BCN → RIO**, 2 passengers.
4. Clicks the Search button.
5. Waits for results.
6. Scrapes and prints flight results.
