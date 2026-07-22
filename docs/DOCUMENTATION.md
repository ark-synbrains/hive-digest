# Documentation guide

This repo treats docs as part of the product. **Any behavior change must update
related documentation in the same PR/commit.**

## Canonical docs

| Doc | Own |
| --- | --- |
| [`README.md`](../README.md) | Product overview, setup, short flowchart, file map |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Full architecture, Graphify roles, pipeline detail |
| [`docs/DOCUMENTATION.md`](DOCUMENTATION.md) | This policy — how/when to update docs |
| [`agent/README.md`](../agent/README.md) | Node sender modules and commands |
| [`digests/README.md`](../digests/README.md) | Canonical emailed-issue archive layout |
| [`agent/out/README.md`](../agent/out/README.md) | Tracked run artifacts + GraphRAG outputs |
| [`.cursor/automations/hive-digest.md`](../.cursor/automations/hive-digest.md) | Monthly Cursor Automation recipe |

Cursor always-on rules:

- [`.cursor/rules/graphify.mdc`](../.cursor/rules/graphify.mdc) — query the codebase graph first
- [`.cursor/rules/documentation.mdc`](../.cursor/rules/documentation.mdc) — keep docs in sync with code

## When you change code, update docs

| If you change… | Also update… |
| --- | --- |
| Pipeline steps in `agent/src/run.mjs` | `docs/ARCHITECTURE.md`, `README.md` flowchart, `agent/README.md`, automation recipe |
| GraphRAG / ranking (`graphrag.mjs`, `validate.mjs`, Python helper) | ARCHITECTURE Role B, README GraphRAG section, env table, automation recipe |
| Archive paths (`digests/`, `agent/out/`) | `digests/README.md`, `agent/out/README.md`, ARCHITECTURE § archive, workflow commit step, automation “commit” instructions |
| Git tracking (`.gitignore`) | This file + any doc that says “tracked” / “gitignored” for that path |
| Codebase Graphify (skill, CI, `graphify-out/`) | ARCHITECTURE Role A, README Knowledge graph section |
| SMTP / secrets / schedule | README scheduled section, `hive-digest.yml` comments, automation recipe |

## Tracked outputs (do not call these gitignored)

- `digests/YYYY-MM-DD/` — human-facing issue archive  
- `agent/out/` — HTML/text scratch **and** content GraphRAG run files  

Both are committed by the monthly workflow after a successful send.

## Checklist before merge

- [ ] No doc still describes removed/renamed paths or flags  
- [ ] Flowcharts match `research → GraphRAG → rank → render → archive → SMTP`  
- [ ] New env vars appear in README and ARCHITECTURE tables  
- [ ] Automation recipe matches what `npm start` actually does  
- [ ] `.graphifyignore` vs `.gitignore` wording is not confused  

## Agents / contributors

Follow `.cursor/rules/documentation.mdc` on every change. Prefer editing the
canonical doc for a topic rather than duplicating long explanations in multiple
places—link to `docs/ARCHITECTURE.md` for deep design detail.
