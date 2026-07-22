# Graph Report - workspace  (2026-07-22)

## Corpus Check
- 16 files · ~15,441 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 153 nodes · 266 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7caa7017`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Research Resilience
- Automation & Delivery
- SMTP Transport
- Render & Sanitize
- Run Orchestration
- Hive Branding & UI
- Validate & Rank
- Research Tests
- Branch Cleanup CI
- graphrag.mjs
- compute_boosts
- Cursor Automation — Hive Digest (monthly)
- Cursor Automation (Preferred)

## God Nodes (most connected - your core abstractions)
1. `main()` - 15 edges
2. `fetchWithRetry()` - 12 edges
3. `enrichDigestWithGraphRag()` - 11 edges
4. `buildIssue()` - 9 edges
5. `Hive Digest — Architecture & Graphify Integration` - 9 edges
6. `sanitizeIssue()` - 8 edges
7. `validateAndRankDigest()` - 8 edges
8. `buildExtraction()` - 7 edges
9. `sanitizeDigestText()` - 7 edges
10. `sendSmtpEmail()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Automatic Merged Branch Deletion` --references--> `Delete Merged PR Branch Workflow`  [EXTRACTED]
  README.md → .github/workflows/delete-merged-branch.yml
- `main()` --calls--> `enrichDigestWithGraphRag()`  [EXTRACTED]
  agent/src/run.mjs → agent/src/graphrag.mjs
- `main()` --calls--> `buildIssue()`  [EXTRACTED]
  agent/src/run.mjs → agent/src/render.mjs
- `main()` --calls--> `researchDigest()`  [EXTRACTED]
  agent/src/run.mjs → agent/src/research.mjs
- `main()` --calls--> `sanitizeIssue()`  [EXTRACTED]
  agent/src/run.mjs → agent/src/sanitize.mjs

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "Research Resilience"
Cohesion: 0.17
Nodes (28): assertCircuitClosed(), decodeHtmlEntities(), dedupe(), fetchWithRetry(), getHostState(), HOST_MIN_INTERVAL_MS, hostOf(), hostState (+20 more)

### Community 1 - "Automation & Delivery"
Cohesion: 0.40
Nodes (5): Agent CLI (agent/), Hive Digest, Validation and Insight Ranking, Hive by Synbrains, Three Content Lanes

### Community 2 - "SMTP Transport"
Cohesion: 0.42
Nodes (8): createTransport(), getSmtpConfig(), isTransientSmtpError(), optionalEnv(), parseBool(), requireEnv(), sendSmtpEmail(), sleep()

### Community 3 - "Render & Sanitize"
Cohesion: 0.22
Nodes (15): { byCategory, sectionOrder, report }, issue, raw, accentBar(), buildIssue(), DEFAULT_ORDER, escapeHtml(), HIVE (+7 more)

### Community 4 - "Run Orchestration"
Cohesion: 0.19
Nodes (15): archiveIssue(), dateStamp(), DIGESTS_DIR, __dirname, formatDate(), hourStamp(), loadState(), main() (+7 more)

### Community 6 - "Validate & Rank"
Cohesion: 0.29
Nodes (11): BOILERPLATE, clamp(), INSIGHT_TERMS, isHttpUrl(), PRIMARY_HOST_HINTS, REQUIRED, scoreInsight(), stripRankingFields() (+3 more)

### Community 8 - "Research Tests"
Cohesion: 0.40
Nodes (4): __test, abs, headers, parsed

### Community 10 - "graphrag.mjs"
Cohesion: 0.13
Nodes (24): AGENT_ROOT, buildExtraction(), computeNodeFallbackBoosts(), conceptId(), __dirname, enabled(), enrichDigestWithGraphRag(), entryId() (+16 more)

### Community 11 - "compute_boosts"
Cohesion: 0.60
Nodes (4): clamp(), compute_boosts(), main(), Score each entry node for GraphRAG ranking boosts (0–12).

### Community 12 - "Cursor Automation — Hive Digest (monthly)"
Cohesion: 0.09
Nodes (20): `agent/` — Hive Digest Node sender, Commands, `/automate` one-liner (local Cursor), Cursor Automation — Hive Digest (monthly), Naming, Prompt, Required environment secrets, Settings (+12 more)

## Knowledge Gaps
- **56 isolated node(s):** `raw`, `{ byCategory, sectionOrder, report }`, `issue`, `__dirname`, `AGENT_ROOT` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `enrichDigestWithGraphRag()` connect `graphrag.mjs` to `Run Orchestration`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `validateAndRankDigest()` connect `Validate & Rank` to `graphrag.mjs`, `Render & Sanitize`, `Run Orchestration`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `sendSmtpEmail()` connect `SMTP Transport` to `Run Orchestration`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `raw`, `{ byCategory, sectionOrder, report }`, `issue` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `graphrag.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Should `Cursor Automation — Hive Digest (monthly)` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._