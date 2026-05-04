# Introduction to Graphify with OpenCode

## What is Graphify?

> **Graphify** is an open-source AI coding assistant skill that transforms any folder — code, docs, PDFs, images, diagrams, videos, or audio — into a **queryable knowledge graph**. 

It was inspired by Andrej Karpathy’s “LLM Wiki” idea and built to give AI coding tools persistent, structured memory of your entire project.

**Perfect for OpenCode** — Graphify works natively with OpenCode, Claude Code, Cursor, Codex, Gemini CLI, and more.

## Why Graphify is Extremely Relevant Today

- **Solves token waste**: Traditional AI assistants re-read entire codebases every session → expensive and slow. Graphify builds the graph **once** and lets the AI query it efficiently (**up to 70x fewer tokens**).
- **Better than basic RAG**: Uses structural analysis (Tree-sitter) + semantic LLM extraction instead of simple similarity search.
- **Multi-modal understanding**: Connects code, documentation, diagrams, and research papers in one unified graph.
- **Persistent memory**: The knowledge graph stays on your machine and improves over time.
- **Privacy-first**: Runs locally; you control your data.

In the era of **OpenCode AI** and large agentic workflows, `Graphify` provides the **structural long-term memory layer** every serious developer needs.

## How to Install & Use Graphify

### 1. Installation

```bash
# Python 3.10+
pip install graphifyy && graphify install
```

> Note: Package name is `graphifyy` (double y) on PyPI.

### 2. Basic Usage

Inside OpenCode or compatible assistant:

```text
/graphify .
```

Or for deeper analysis:

```text
/graphify . --deep
```

### 3. What You Get

- `graphify-out/` folder with:
  - Interactive HTML graph visualization
  - Queryable knowledge graph
  - Obsidian-compatible vault (optional)
  - Summaries and relationship maps

### 4. Example Workflow with OpenCode

1. Open your project in OpenCode
2. Run `/graphify .`
3. Ask natural questions like:
   - “How does authentication flow work across services?”
   - “What calls the payment processor and where are the edge cases?”
   - “Summarize the architecture and suggest improvements”

## Key Benefits for OpenCode Users

- Dramatically lower API costs
- Much smarter cross-file reasoning
- Persistent project understanding across sessions
- Excellent for large, complex, or multi-modal repositories
- Fully open-source (MIT license)

**GitHub**: https://github.com/safishamsi/graphify  
**Website**: https://graphify.net/


