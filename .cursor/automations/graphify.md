# Cursor Automation — graphify on PR merge

Use this when creating the automation at [cursor.com/automations/new](https://cursor.com/automations/new) or via `/automate` in a local Cursor session.

> Cloud agents in this environment could not create the automation via the web UI (Cloudflare bot check). Paste the settings below once in the dashboard to activate the Cursor-native trigger. The repo also includes a GitHub Actions fallback (`.github/workflows/graphify.yml`).

## Settings

| Field | Value |
| --- | --- |
| **Name** | Graphify (on PR merge) |
| **Trigger** | Source control → **Pull request merged** (GitHub) |
| **Repository** | `ark-synbrains/hive-digest` @ `main` |
| **Environment** | `ark-synbrains/hive-digest` |
| **Tools** | Memories on · PR creation **on** |
| **Model** | Any current cloud-agent model |

## Prompt

```
You are the graphify rebuild automation for repo ark-synbrains/hive-digest.

## Task
Whenever a pull request is merged into main: refresh the checked-in knowledge graph under graphify-out/ so agents stay query-first on current code.

### Skip early when appropriate
- If the merged PR only touched `graphify-out/**` (or is itself a chore(graphify) PR), do nothing and exit.
- If after rebuild there is no meaningful diff under `graphify-out/`, do nothing (no PR, no commit).

### Preferred implementation
1. Ensure the graphify CLI is available:
   `uv tool install graphifyy`  (or `pipx install graphifyy` / `pip install graphifyy`)
2. From the repo root, run an AST-only incremental rebuild (no API key needed):
   `graphify update . --force`
3. Follow the project graphify skill (`.agents/skills/graphify/SKILL.md`) and always-on rule (`.cursor/rules/graphify.mdc`):
   - Prefer `graphify update .` for code changes.
   - If the merged PR changed docs/papers/images (not just code), run a full `/graphify --update` skill flow so semantic nodes stay current. Do not ask for API keys; proceed without Gemini if unset.
4. After modifying code/docs files in any follow-up edit, keep the graph current (`graphify update .`).

### What to commit
Update tracked graphify artifacts as needed:
- `graphify-out/graph.json`
- `graphify-out/graph.html`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/manifest.json`
- any other tracked files under `graphify-out/` that the rebuild refreshes

Do not commit machine-local ignores (`.graphify_python`, cache/, etc. — already in `.gitignore`).

### After success
- Open a PR against `main` with:
  - Branch: `cursor/graphify-rebuild-<short-sha>` (or similar `cursor/` prefix)
  - Title: `chore(graphify): rebuild knowledge graph after merge`
  - Body: note which merged PR triggered the run, and a short summary of graph delta (nodes/edges if available).
- Enable draft=false only if the diff is clearly mechanical graph output; otherwise leave as draft.
- Update memories: store last_merged_pr, last_success_at, and whether a graphify PR was opened.

### Failure
Do not pretend success. Record the error in memory and stop. Do not open an empty PR.
```

## `/automate` one-liner (local Cursor)

```
/automate When a pull request is merged into main on ark-synbrains/hive-digest, rebuild the graphify knowledge graph with `graphify update . --force` (and full /graphify --update if docs/papers/images changed). Skip if the merged PR only touched graphify-out. If graphify-out changed, open a PR titled "chore(graphify): rebuild knowledge graph after merge". No API keys required for the AST path.
```
