# graphify first steps

### 1. Quick Status / Overview

```bash
/graphify
```

(Runs full pipeline if needed, or shows current graph stats if already built)

### 2. Open the Interactive Graph (Most Important)

```bash
/graphify
# Then open: graphify-out/graph.html in your browser
```

This is your main visual entry point.

### 3. Read the Plain-Language Report

```bash
cat graphify-out/GRAPH_REPORT.md | head -n 100
```

(or just open it in your editor)

### 4. Explore with Natural Language Questions (BFS - Broad Context)

```bash
/graphify query "What is the core architecture of this project?"
/graphify query "How does authentication work?"
/graphify query "What are the main data flows?"
```

### 5. Trace Specific Connections (DFS - Deep Path)

```bash
/graphify query "How does user login reach the database?" --dfs
```

### 6. Find Connections Between Two Concepts

```bash
/graphify path "AuthModule" "Database"
/graphify path "UserService" "PaymentGateway"
```

### 7. Explain Any Concept/Node

```bash
/graphify explain "Context"
/graphify explain "SwinTransformer"
/graphify explain "MainController"
```

### 8. See the Most Important Nodes

```bash
/graphify query "What are the most central / god nodes in this codebase?"
```

(or just read the **God Nodes** section in GRAPH_REPORT.md)

### 9. Discover Surprising Cross-Connections

```bash
/graphify query "What are the most interesting or unexpected connections in this graph?"
```

### 10. Community / Module Overview

```bash
/graphify query "Summarize the main communities or modules in this project"
```

---

### Bonus Quick Starters (Very Useful)

- **Incremental update** after you change files:
  
  ```bash
  /graphify --update
  ```

- **Re-cluster with better labels**:
  
  ```bash
  /graphify --cluster-only
  ```

- **Start MCP server** so other agents can query the graph:
  
  ```bash
  /graphify --mcp
  ```

---

**Recommended first workflow:**

1. Run `/graphify` (builds everything)
2. Open `graphify-out/graph.html`
3. Read the **God Nodes**, **Surprising Connections**, and **Suggested Questions** sections from `GRAPH_REPORT.md`
4. Start asking questions with `/graphify query "..."`
5. Use `/graphify explain "NodeName"` on anything interesting


