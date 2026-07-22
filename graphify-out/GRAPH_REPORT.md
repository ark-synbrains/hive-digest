# Graph Report - .  (2026-07-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 128 nodes · 220 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ebe5cf2e`
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

## God Nodes (most connected - your core abstractions)
1. `main()` - 13 edges
2. `fetchWithRetry()` - 12 edges
3. `buildIssue()` - 8 edges
4. `Node Agent (npm start --prefix agent)` - 8 edges
5. `sanitizeIssue()` - 7 edges
6. `hostOf()` - 6 edges
7. `withHostPace()` - 6 edges
8. `searchOpenAlex()` - 6 edges
9. `researchDigest()` - 6 edges
10. `sanitizeNewsletterText()` - 6 edges

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

## Communities (10 total, 1 thin omitted)

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
Cohesion: 0.24
Nodes (12): dateStamp(), __dirname, formatDate(), hourStamp(), loadState(), main(), MONTHS, parseRecipients() (+4 more)

### Community 5 - "Hive Branding & UI"
Cohesion: 0.18
Nodes (13): Dark Hive Theme, Agent CLI (agent/), Hive Digest, Hive by Synbrains, tech-digest-agent.html Browser Artifact, Three Content Lanes, Anthropic Messages API, categoryPrompt (+5 more)

### Community 6 - "Validate & Rank"
Cohesion: 0.29
Nodes (11): BOILERPLATE, clamp(), INSIGHT_TERMS, isHttpUrl(), PRIMARY_HOST_HINTS, REQUIRED, scoreInsight(), stripRankingFields() (+3 more)

### Community 7 - "SMTP Transport"
Cohesion: 0.52
Nodes (6): createTransport(), getSmtpConfig(), optionalEnv(), parseBool(), requireEnv(), sendSmtpEmail()

### Community 8 - "Research Tests"
Cohesion: 0.40
Nodes (4): __test, abs, headers, parsed

## Knowledge Gaps
- **33 isolated node(s):** `name`, `version`, `private`, `type`, `description` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Node Agent (npm start --prefix agent)` connect `Automation & Delivery` to `Hive Branding & UI`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Hive Digest` connect `Hive Branding & UI` to `Automation & Delivery`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Node Agent (npm start --prefix agent)` (e.g. with `Agent Start Step (npm start --prefix agent)` and `Agent CLI (agent/)`) actually correct?**
  _`Node Agent (npm start --prefix agent)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._