# `agent/` — Hive Digest Node sender

npm package: **`hive-digest-agent`**

This directory is the **scheduled Node CLI** that researches, validates/ranks,
and emails a Hive Digest issue via SMTP. It is **not** a Cursor Cloud Agent.

| Piece | Role |
| --- | --- |
| `src/run.mjs` | Orchestration (`npm start` / `npm run generate`) |
| `src/research.mjs` | HN + arXiv (+ OpenAlex / HN fallbacks) → `researchDigest()` |
| `src/graphrag.mjs` | Content GraphRAG (Graphify) → `_graphBoost` ranking hints |
| `src/validate.mjs` | Schema + insight ranking → `validateAndRankDigest()` |
| `src/render.mjs` | Dark email HTML/text → `buildIssue()` (`HIVE` palette) |
| `src/sanitize.mjs` | `sanitizeDigestText` / `sanitizeIssue` |
| `src/smtp.mjs` | nodemailer transport (`SMTP_*` env) |
| `scripts/build_content_graph.py` | Graphify build/cluster helper for content boosts |
| `state.json` | Local send history (tracked; updated on successful sends) |

Pipeline: `researchDigest` → `enrichDigestWithGraphRag` → `validateAndRankDigest`
→ `buildIssue` → `sanitizeIssue` → archive `digests/` → SMTP.

Set `HIVE_GRAPHRAG=0` to skip the content-graph step. Install `graphifyy` on the
runner for the preferred Graphify engine; otherwise a Node fallback is used.

Browser UI counterpart (Claude.ai artifact): [`../hive-digest.html`](../hive-digest.html).

System design + Graphify roles: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

Monthly automation entrypoints:

- [`.github/workflows/hive-digest.yml`](../.github/workflows/hive-digest.yml)
- [`.cursor/automations/hive-digest.md`](../.cursor/automations/hive-digest.md)

### Commands

```bash
npm install
npm test           # research + digest pipeline regression tests
npm run generate   # dry-run → digests/YYYY-MM-DD/ + agent/out/
npm start          # research + archive + send (needs SMTP_* + NEWSLETTER_TO_EMAILS)
```

Every generated issue (dry-run or send) is written to **`digests/YYYY-MM-DD/`** in the
repo (`hive-digest.html`, `.txt`, ranking/GraphRAG/meta JSON). Matching run
artifacts also go to **`agent/out/`** (tracked — HTML/text copies + GraphRAG
graph under `agent/out/digest-graph/`). See [`out/README.md`](out/README.md).
Monthly GitHub Actions commits new `digests/` and `agent/out/` folders after a
successful send.


`NEWSLETTER_TO_EMAILS` is the recipient-list secret name (historical); the
product name is still **Hive Digest**.
