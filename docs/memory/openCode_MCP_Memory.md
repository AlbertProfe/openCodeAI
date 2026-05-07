# MCP & Memory: Long-Term Project Recall for AI Agents

## Introduction to AI Memory

> **AI agents are forgetful**—they lose context after each session (<mark>128K token limit</mark>). **Memory systems** give them ""long-term recall"" like humans, storing knowledge externally for on-demand access.

Why <mark>Memory</mark> is Crucial

```
Without memory: ""What's our AWS caching pattern?"" → Hallucination
With memory: → SQLite lookup → ""ElastiCache Redis, TTL 300s""
```

Benefits:

- **Continuity**: Remembers our React/Spring/AWS decisions across days
- **Efficiency**: No repeating project context in every prompt
- **Accuracy**: Grounded facts, not model guesses
- **Personalization**: Per-dev (`user_id='dev1'`)

### Memory types

> When building AI agents, manage **memory** by separating what the agent needs only right now from what should persist across conversations. 

- **Working memory**: short-lived context for the current task, like the active conversation, recent tool outputs, and intermediate reasoning state. Keep it small because it directly affects token usage and latency.

- **Episodic memory**: a record of prior interactions, decisions, and outcomes from past conversations. Use it for continuity, such as remembering user preferences or what the agent already tried.

- **Vector database**: stores embeddings for semantic retrieval. Use it when the agent needs to find relevant past notes, documents, or memories by meaning rather than exact keywords.

- **SQL or structured DB**: stores facts with clear fields, such as user profile data, tasks, permissions, or agent state. Use this for reliable queries, filtering, and updates.

- **File storage**: keeps larger artifacts like documents, logs, PDFs, images, and transcripts. Use it when the data is too large or unstructured for a database.[]

### Design rules & Recommended architecture

> A good pattern is: **keep working memory small, write important results to durable storage, and retrieve only what is relevant**. 

In practice, this means:

1. Put the current task, recent conversation, and tool results in <mark>working memory.</mark>
2. Save stable facts and preferences in a <mark>structured store.</mark>
3. Save long text or documents in <mark>file storage</mark>.
4. Index <mark>semantically</mark> useful content in a <mark>vector DB for retrieval</mark>.
5. Log important conversation events as <mark>episodic memory</mark> for future context.

> Not every detail should be remembered. Store only information that is useful later, stable enough to trust, and safe to retain. 
> 
> Also **define expiration rules for temporary memory**, so stale context does not keep affecting decisions.

A simple agent memory stack looks like this:

- **Working memory** for the active session.
- **Episodic memory** for conversation history.
- **Structured DB** for facts and preferences.
- **Vector DB** for semantic recall.
- **File storage** for large raw artifacts.

Summary table:

| Type           | What                    | Our Use Case                       | Storage           |
| -------------- | ----------------------- | ---------------------------------- | ----------------- |
| **Short-term** | Current chat (volatile) | Active debugging                   | LLM context       |
| **Long-term**  | Facts learned over time | Project architecture               | SQLite rows       |
| **Episodic**   | Events/timestamps       | ""Added React v2.0 on 2026-04-23"" | `created_at` col  |
| **Semantic**   | Concepts/relations      | ""Caching = ElastiCache → Redis""  | Embeddings/search |

**MCP Pattern**: Agent → MCP tools → Memory store → Structured JSON back.

## MCP

> Universal **AI-to-tool** protocol (JSON-RPC). Your agent discovers/uses ""memory tools"" dynamically—no hardcoded REST.

**Unlike REST**: AI-friendly, stateful, auto-discovery.

### MCP Server as Memory Bridge

Think of it like a USB drive plugged into your computer—the server is the drive (SQLite, vector DB, or files), MCP is the USB standard (API calls like `tools/call` for `search_memories`), and <mark>OpenCode/Spring or Boot Orchestrator</mark> are the computer pulling data when needed. 

This solves memory silos: short-term (in-prompt) for quick chats, long-term/episodic (server-stored) for continuity across sessions, all via standardized queries.

Why Long-Term Memory for Projects? For example to store info like:

- **Project summary**
- **Structure** (folders/files) 
- **Architecture** (layers/services)
- **Flows** (login → cache → DB)

Versioned evolution tracking—no repetition.

### Memory Context in MCP

> <mark>Memory context</mark> is crucial because AI models have short-term limits—they forget details across sessions without help. MCP enables persistent, long-term memory via external servers (e.g.,**SQLite-backed ones**), storing and retrieving context like coding preferences or project history. 
> 
> This boosts continuity, reduces repetition, and improves decision-making by keeping relevant info accessible and isolated from unrelated data. 

SQLite Schema: Versioned Storage

| id  | user_id | type      | content (JSON)                      | version | version_label | change_summary      |
| --- | ------- | --------- | ----------------------------------- | ------- | ------------- | ------------------- |
| 1   | dev1    | structure | `{"folders":["src/main/java/..."]}` | 1       | v1.0-initial  | Bootstrap project   |
| 2   | dev1    | structure | `{"folders":["...","services"]}`    | 2       | v1.1-services | Added services      |
| 3   | dev1    | structure | `{"folders":["frontend/..."]}`      | 3       | v2.0-react    | Monorepo with React |

**Queries**:

- Latest: `WHERE type='structure' ORDER BY version DESC LIMIT 1`
- History: `SELECT version_label, change_summary ORDER BY version`
- Specific: `WHERE version_label='v1.1-services'`

### Spring Boot MCP Server

Why Great for <mark>Spring Boot Orchestrator</mark>

> Spring Boot shines here—MCP keeps memory external (SQLite for local dev), your orchestrator handles LLM calls + tool routing via `@Tool` annotations, and agents query precisely (e.g., "get project flows") for stateful workflows. Better than Node for your Java ecosystem: auto-config, HikariCP pooling, JPA if expanding, and deployable to Lambda/EC2.

#### Dependencies

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-mcp-spring-boot-starter</artifactId>
</dependency>
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
</dependency>
```

#### MemoryService.java

```java
@Service
public class MemoryService {
    public void store(String userId, String type, String content, int version, String label, String summary) {
        jdbc.update(""INSERT INTO project_memories VALUES(?,?,?,?,?,?,?,?)"",
                   userId, type, content, version, label, summary, now());
    }

    public String getLatest(String userId, String type) {
        return jdbc.queryForObject(
            ""SELECT content FROM project_memories WHERE user_id=? AND type=? ORDER BY version DESC LIMIT 1"",
            String.class, userId, type);
    }
}
```

#### Usage Flow

```
1. ""Store structure v2.0-react"" → New versioned row
2. ""Current architecture?"" → Latest JSON
3. ""Compare v1 vs v3"" → Multi-row query
```

**SQLite vs DynamoDB**: Local/free for dev → Cloud/scale for prod.

*Our full-stack memory system—AI-ready, versioned, local-first.*

## MCP vs API REST

Our SQLite database holds all the project data (structure, architecture, summaries, flows) persistently, and the Spring Boot MCP server acts as the smart bridge. 

The agent (our orchestrator + LLM) speaks natural language like "recall the login flow architecture," MCP translates it to precise DB queries, and you skip rigid REST endpoints because MCP enables conversational, adaptive access tailored for AI.

REST forces hardcoded paths like `GET /api/memories?type=flows&key=login`—great for apps, but clunky for AI that thinks in sentences. MCP lets the LLM:

- **Discover** tools dynamically (no docs lookup).

- **Query naturally**: "What caching patterns did we use?" → MCP tool call → SQL `SELECT * FROM memories WHERE content LIKE '%ElastiCache%'`.

- **Chain intelligently**: Pull arch → analyze → suggest AWS fixes, all stateful.

our flow:

```js
Natural query: "Show project structure for React components"
     ↓ LLM reasons
MCP tool: search_project_memories(query="React components")
     ↓ Server logic
SQLite: SELECT content FROM project_memories WHERE ...
     ↓ Results
LLM: "Frontend: src/components/pages (login, dashboard)..."[web:57][web:63]
```

### Enhanced Spring Boot MCP for Natural Queries

We will update our `ProjectMemoryTools.java` with LLM-powered NL-to-query (add OpenAI/Gemini client):

```java
@Tool(description = "Ask about project in natural language, e.g., 'login flows with caching'")
public String naturalQueryProject(String question) {
    // LLM prompt: "Convert to SQL-like search: " + question
    String searchQuery = chatClient.prompt()
        .user("From project_memories table (cols: type,content,query_key), generate search terms for: " + question)
        .call().content(); // e.g., "flows AND cache"
    return memoryService.search(searchQuery);
}
```

Now agent chats: "Natural query: ElastiCache integration?" → auto-DB hit, grounded response. Perfect for your AWS-heavy projects—no REST boilerplate, just intelligent memory.
