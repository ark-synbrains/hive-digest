# Graph Report - workspace  (2026-07-22)

## Corpus Check
- 16 files · ~13,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 152 nodes · 262 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9eed2f31`
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
- graphrag.mjs
- compute_boosts
- Cursor Automation — Hive Digest (monthly)
- Cursor Automation (Preferred)

## God Nodes (most connected - your core abstractions)
1. `main()` - 14 edges
2. `fetchWithRetry()` - 12 edges
3. `enrichDigestWithGraphRag()` - 11 edges
4. `buildIssue()` - 9 edges
5. `sanitizeIssue()` - 8 edges
6. `validateAndRankDigest()` - 8 edges
7. `buildExtraction()` - 7 edges
8. `sanitizeDigestText()` - 7 edges
9. `sendSmtpEmail()` - 7 edges
10. `hostOf()` - 6 edges

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

## Communities (14 total, 3 thin omitted)

### Community 0 - "Research Resilience"
Cohesion: 0.17
Nodes (28): assertCircuitClosed(), decodeHtmlEntities(), dedupe(), fetchWithRetry(), getHostState(), HOST_MIN_INTERVAL_MS, hostOf(), hostState (+20 more)

### Community 1 - "Automation & Delivery"
Cohesion: 0.40
Nodes (5): Agent CLI (agent/), Hive Digest, Validation and Insight Ranking, Hive by Synbrains, Three Content Lanes

### Community 2 - "Agent Package Config"
Cohesion: 0.13
Nodes (14): dependencies, nodemailer, description, engines, node, name, private, scripts (+6 more)

### Community 3 - "Render & Sanitize"
Cohesion: 0.22
Nodes (15): { byCategory, sectionOrder, report }, issue, raw, accentBar(), buildIssue(), DEFAULT_ORDER, escapeHtml(), HIVE (+7 more)

### Community 4 - "Run Orchestration"
Cohesion: 0.24
Nodes (12): dateStamp(), __dirname, formatDate(), hourStamp(), loadState(), main(), MONTHS, parseRecipients() (+4 more)

### Community 6 - "Validate & Rank"
Cohesion: 0.15
Nodes (18): baseScore, boostedScore, { byCategory: ranked, report }, { extraction, idMap }, fallback, sample, serialized, tmp (+10 more)

### Community 7 - "SMTP Transport"
Cohesion: 0.42
Nodes (8): createTransport(), getSmtpConfig(), isTransientSmtpError(), optionalEnv(), parseBool(), requireEnv(), sendSmtpEmail(), sleep()

### Community 8 - "Research Tests"
Cohesion: 0.40
Nodes (4): __test, abs, headers, parsed

### Community 10 - "graphrag.mjs"
Cohesion: 0.21
Nodes (17): AGENT_ROOT, buildExtraction(), computeNodeFallbackBoosts(), conceptId(), __dirname, enabled(), enrichDigestWithGraphRag(), entryId() (+9 more)

### Community 11 - "compute_boosts"
Cohesion: 0.60
Nodes (4): clamp(), compute_boosts(), main(), Score each entry node for GraphRAG ranking boosts (0–12).

### Community 12 - "Cursor Automation — Hive Digest (monthly)"
Cohesion: 0.20
Nodes (8): `agent/` — Hive Digest Node sender, Commands, `/automate` one-liner (local Cursor), Cursor Automation — Hive Digest (monthly), Naming, Prompt, Required environment secrets, Settings

## Knowledge Gaps
- **55 isolated node(s):** `name`, `version`, `private`, `type`, `description` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `enrichDigestWithGraphRag()` connect `graphrag.mjs` to `Run Orchestration`, `Validate & Rank`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `validateAndRankDigest()` connect `Validate & Rank` to `Render & Sanitize`, `Run Orchestration`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `sendSmtpEmail()` connect `SMTP Transport` to `Run Orchestration`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _55 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._