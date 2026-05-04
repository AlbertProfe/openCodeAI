**Step-by-step guide to test a React form in dev mode using WebMCP (so an AI agent can fill and submit it).**

WebMCP (Web Model Context Protocol) is a new Chrome browser standard that lets your website expose structured **tools** (like form submission) directly to AI agents. Instead of the agent guessing DOM elements or using brittle clicks, it calls a clean, typed tool that Chrome fills in automatically. This works perfectly on http://localhost during development.

### 1. Prerequisites (one-time setup)

- **Chrome Canary** (version 146+): Download from the official Google Chrome Canary page and install it.
- Enable the WebMCP flag:
  1. Open Chrome Canary.
  2. Go to chrome://flags/#enable-webmcp-testing.
  3. Set it to **Enabled** and relaunch the browser.
- **Model Context Tool Inspector** (the “agent” tester):
  1. Install the official extension from the Chrome Web Store (search “Model Context Tool Inspector” or get it from GoogleChromeLabs/webmcp-tools on GitHub).
     1. https://chromewebstore.google.com/detail/webmcp-model-context-tool/gbpdfapgefenggkahomfgkhfehlcenpd
     2. [GitHub - GoogleChromeLabs/webmcp-tools · GitHub](https://github.com/GoogleChromeLabs/webmcp-tools/)
  2. In the extension settings, enable “Allow access to file URLs and localhost”.
     3- Verify it works: Open DevTools (F12) → Console and run console.log(navigator.modelContext). It should return an object, not undefined.
     1- An object in the output (rather than `undefined`) confirms the API is available. From here, you can install the [Model Context Tool Inspector Extension](https://chromewebstore.google.com/detail/webmcp-model-context-tool/gbpdfapgefenggkahomfgkhfehlcenpd) and open [Google's travel demo](https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/) to see tool registration working on a real page.
- [WebMCP Travel](https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/)
