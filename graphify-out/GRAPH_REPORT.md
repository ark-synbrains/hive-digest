# Graph Report - workspace  (2026-07-22)

## Corpus Check
- 20 files · ~20,158 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 188 nodes · 271 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6e5b7d58`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Research Resilience
- Automation & Delivery
- Agent Package Config
- Render & Sanitize
- Run Orchestration
- Hive Branding & UI
- Validate & Rank
- SMTP Transport
- Research Tests
- Branch Cleanup CI
- /graphify
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native AGENTS.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `main()` - 13 edges
2. `What You Must Do When Invoked` - 12 edges
3. `fetchWithRetry()` - 12 edges
4. `/graphify` - 10 edges
5. `graphify reference: extra exports and benchmark` - 8 edges
6. `buildIssue()` - 8 edges
7. `Node Agent (npm start --prefix agent)` - 8 edges
8. `sanitizeIssue()` - 7 edges
9. `hostOf()` - 6 edges
10. `withHostPace()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Node Agent (npm start --prefix agent)` --semantically_similar_to--> `Agent CLI (agent/)`  [INFERRED] [semantically similar]
  .cursor/automations/newsletter.md → README.md
- `Node Agent (npm start --prefix agent)` --semantically_similar_to--> `Agent Start Step (npm start --prefix agent)`  [INFERRED] [semantically similar]
  .cursor/automations/newsletter.md → .github/workflows/newsletter.yml
- `Insight Value Ranking` --semantically_similar_to--> `Validation and Insight Ranking`  [INFERRED] [semantically similar]
  .cursor/automations/newsletter.md → README.md
- `Dark Hive Theme` --semantically_similar_to--> `NEWSLETTER_DARK Theme Palette`  [INFERRED] [semantically similar]
  .cursor/automations/newsletter.md → tech-digest-agent.html
- `Hive Digest Browser UI` --semantically_similar_to--> `Hive Digest`  [INFERRED] [semantically similar]
  tech-digest-agent.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Monthly Hive Digest Automation Pipeline** — cursor_automations_newsletter_hive_digest_automation, github_workflows_newsletter_hive_digest_monthly, cursor_automations_newsletter_node_agent, cursor_automations_newsletter_smtp_delivery [EXTRACTED 1.00]
- **Research Source Fallback Chain** — cursor_automations_newsletter_hn_algolia, cursor_automations_newsletter_arxiv, cursor_automations_newsletter_openalex, cursor_automations_newsletter_source_fallback [EXTRACTED 1.00]
- **Client-Side Insight Ranking Flow** — tech_digest_agent_validate_item, tech_digest_agent_score_insight, tech_digest_agent_rank_items [EXTRACTED 1.00]

## Communities (19 total, 4 thin omitted)

### Community 0 - "Research Resilience"
Cohesion: 0.17
Nodes (28): assertCircuitClosed(), decodeHtmlEntities(), dedupe(), fetchWithRetry(), getHostState(), HOST_MIN_INTERVAL_MS, hostOf(), hostState (+20 more)

### Community 1 - "Automation & Delivery"
Cohesion: 0.17
Nodes (18): arXiv Research Source, Hive Digest (monthly) Cursor Automation, HN Algolia Research Source, Insight Value Ranking, Monthly Cron 09:00 IST, Node Agent (npm start --prefix agent), OpenAlex Paper Backup, SMTP Newsletter Delivery (+10 more)

### Community 2 - "Agent Package Config"
Cohesion: 0.13
Nodes (14): dependencies, nodemailer, description, engines, node, name, private, scripts (+6 more)

### Community 3 - "Render & Sanitize"
Cohesion: 0.27
Nodes (12): accentBar(), buildIssue(), DEFAULT_ORDER, escapeHtml(), HIVE, SECTION_META, decodeHtmlEntities(), REPLACEMENTS (+4 more)

### Community 4 - "Run Orchestration"
Cohesion: 0.17
Nodes (18): dateStamp(), __dirname, formatDate(), hourStamp(), loadState(), main(), MONTHS, parseRecipients() (+10 more)

### Community 5 - "Hive Branding & UI"
Cohesion: 0.18
Nodes (13): Dark Hive Theme, Agent CLI (agent/), Hive Digest, Hive by Synbrains, tech-digest-agent.html Browser Artifact, Three Content Lanes, Anthropic Messages API, categoryPrompt (+5 more)

### Community 6 - "Validate & Rank"
Cohesion: 0.29
Nodes (11): BOILERPLATE, clamp(), INSIGHT_TERMS, isHttpUrl(), PRIMARY_HOST_HINTS, REQUIRED, scoreInsight(), stripRankingFields() (+3 more)

### Community 7 - "SMTP Transport"
Cohesion: 0.13
Nodes (15): Part A - Structural extraction for code files, Part B - Semantic extraction (parallel subagents), Part C - Merge AST + semantic into final extraction, Step 0 - GitHub repos and multi-path merge (only if a URL or several paths), Step 1 - Ensure graphify is installed, Step 2.5 - Video and audio (only if video files detected), Step 2 - Detect files, Step 3 - Extract entities and relationships (+7 more)

### Community 8 - "Research Tests"
Cohesion: 0.40
Nodes (4): __test, abs, headers, parsed

### Community 10 - "/graphify"
Cohesion: 0.20
Nodes (9): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Usage (+1 more)

### Community 11 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 12 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 13 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 14 - "graphify reference: commit hook and native AGENTS.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native AGENTS.md integration, graphify reference: commit hook and native AGENTS.md integration

### Community 15 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **74 isolated node(s):** `Usage`, `What graphify is for`, `Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)`, `Step 1 - Ensure graphify is installed`, `Step 2 - Detect files` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `What You Must Do When Invoked` connect `SMTP Transport` to `/graphify`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `Node Agent (npm start --prefix agent)` connect `Automation & Delivery` to `Hive Branding & UI`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `/graphify` connect `/graphify` to `SMTP Transport`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `Usage`, `What graphify is for`, `Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `SMTP Transport` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._