# Hive Digest — Synbrains newsletter agent

Generates a changelog-style **Hive Digest** for [hive.synbrains.ai](https://hive.synbrains.ai/):
new/updated AI models, algorithms & systems techniques, and company product
releases — each pulled live from the web, validated, ranked by insight value,
and written up with a source link.

Brand: **Hive by Synbrains** (accents `#EE462F` → `#7610C7`).

---

## Features

- **Live generation** — pulls current developments across three lanes:
  *models & research*, *algorithms & systems*, and *product & company
  releases*.
- **Validation & insight ranking** — each entry is schema-validated, then
  scored for engineer understanding. Higher-scoring stories appear first;
  weaker sections sort last. **Scores are never shown** in the newsletter.
- **Scoped runs** — narrow a run to just one lane in the HTML tool.
- **Retry & timeout handling** — every upstream (HN, arXiv, OpenAlex, and
  the HTML tool’s Anthropic calls) retries transient 429/408/5xx with
  backoff. The Node agent paces per host, times out hung requests, falls
  back across sources (arXiv→OpenAlex→HN; alternate HN queries per lane),
  and soft-fails individual queries so one rate-limit cannot abort the digest.
- **Hive branding** — dark UI with Synbrains red→purple gradient accents,
  matching [hive.synbrains.ai](https://hive.synbrains.ai/).
- **Download the issue** — export Markdown or standalone dark HTML
  (`Hive Digest` branding).
- **Responsive layout** — usable from phone to desktop.
- **Knowledge graph** — [graphify](https://github.com/Graphify-Labs/graphify) maps the
  codebase (AST + docs) into a queryable graph under `graphify-out/`.

## How to use it

1. Open `tech-digest-agent.html` inside a Claude.ai artifact (see
   **Important: where this runs**, below).
2. Optionally narrow the scope with the dropdown.
3. Click **generate Hive Digest**. Lanes fill in as they complete; entries
   are ranked by insight score (scores stay hidden).
4. Download `.md` or `.html` when ready. HTML exports always use the dark
   Hive theme.

## Knowledge graph (graphify)

This repo includes a checked-in [graphify](https://github.com/Graphify-Labs/graphify)
knowledge graph of the agent, automations, and docs.

**Visualize the graph** (opens in a new tab):

<a href="https://htmlpreview.github.io/?https://github.com/ark-synbrains/dev-digest/blob/main/graphify-out/graph.html" target="_blank" rel="noopener noreferrer"><strong>Open interactive graph.html</strong></a>

Also available locally at [`graphify-out/graph.html`](graphify-out/graph.html)
(open the file in a browser after cloning). Companion artifacts:

- [`graphify-out/graph.json`](graphify-out/graph.json) — queryable graph data
- [`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md) — communities, god nodes, suggested questions

### Rebuild / query

```bash
# install once (PyPI package name is temporarily graphifyy)
pip install graphifyy && graphify install --platform cursor

# AST-only refresh after code changes (no LLM)
graphify update .

# full rebuild in Cursor / Claude
/graphify .

# query the existing graph
graphify query "how does research fall back across sources?"
graphify path "researchDigest" "sendSmtpEmail"
graphify explain "fetchWithRetry"
```

## Important: where this runs

This tool calls `https://api.anthropic.com/v1/messages` directly from the
browser, with Claude's web search tool enabled. That request only succeeds
inside a Claude.ai artifact (or another Claude surface that provides the same
proxy).

**Opening this file directly in a plain browser will not work** — there's no
API key configured client-side.

## Customizing

**Colors** — Hive tokens live in `:root` (`--hive-red`, `--hive-purple`, …).
Email/export palettes are fixed in `NEWSLETTER_DARK` and `agent/src/render.mjs`.

**Insight ranking** — `agent/src/validate.mjs` (`validateAndRankDigest`) for
the Node agent; mirrored client-side in `tech-digest-agent.html`.

**Category focus / prompts** — `categoryPrompt(cat, today)` in the HTML
`<script>` block.

## Scheduled newsletter (automation)

Two ways to generate and email Hive Digest on a timer:

1. **Cursor Automation (preferred)** — paste
   [`.cursor/automations/newsletter.md`](.cursor/automations/newsletter.md)
   at [cursor.com/automations](https://cursor.com/automations), on the **1st of
   each month at 09:00 IST** (`CRON_TZ=Asia/Kolkata 0 9 1 * *`).
2. **GitHub Actions fallback** —
   [`.github/workflows/newsletter.yml`](.github/workflows/newsletter.yml)
   runs `agent/` on the **1st of each month at 09:00 IST** (`30 3 1 * *` UTC).

Merged PR feature branches are deleted automatically by
[`.github/workflows/delete-merged-branch.yml`](.github/workflows/delete-merged-branch.yml)
(same-repo heads only; `main`/`master` are never deleted).

### Agent CLI

```bash
npm install --prefix agent
# preview only (writes agent/out/ + ranking.json)
npm run generate --prefix agent
# send for real (needs SMTP secrets below)
npm start --prefix agent
```

Secrets (Cursor environment and/or GitHub Actions):

- `SMTP_HOST`
- `SMTP_PORT` (e.g. `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (e.g. `Hive Digest <news@example.com>`)
- `NEWSLETTER_TO_EMAILS`

Optional: `SMTP_SECURE`, `SMTP_REPLY_TO`

## File structure

```
tech-digest-agent.html              browser artifact UI (Hive branded)
agent/                              Node generator + validate/rank + SMTP
  src/validate.mjs                  schema validation + insight scoring
  src/research.mjs                  HN + arXiv research (OpenAlex / HN fallback)
  src/render.mjs                    Hive Digest email HTML (dark)
  src/run.mjs                       orchestration
graphify-out/                       knowledge graph (graphify)
  graph.html                        interactive visualization
  graph.json                        queryable graph data
  GRAPH_REPORT.md                   communities / god nodes / questions
.github/workflows/newsletter.yml
.cursor/automations/newsletter.md
.cursor/rules/graphify.mdc
README.md
```
