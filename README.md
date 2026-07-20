# /dev/digest — technical newsletter agent

A self-contained, single-file HTML tool that generates a changelog-style tech
newsletter for hands-on engineers and researchers: new/updated AI models, new
algorithms and systems techniques, and company product releases — each pulled
live from the web and written up with a source link.

No build step, no server, no dependencies to install. Open the file and go.

---

## Features

- **Live generation** — pulls current developments via web search across three
  lanes: *models & research*, *algorithms & systems*, and *product & company
  releases*. Runs the three lanes in parallel and renders each as it completes,
  instead of blocking on the slowest one.
- **Scoped runs** — narrow a run to just one lane instead of the full mix.
- **Retry & timeout handling** — transient network errors and 429/5xx
  responses are retried once automatically; a lane that still fails shows the
  real error message inline instead of a generic failure.
- **Phosphor terminal look** — the generator UI uses a dark "phosphor terminal"
  palette (green accents on near-black).
- **Download the issue** — export the current issue as Markdown (`.md`, plain
  text, good for pasting into Notion/GitHub/Slack) or as a styled, standalone
  HTML file. Exported / emailed newsletter HTML is **always dark theme**, even
  if the surrounding UI look changes later.
- **Responsive layout** — usable from small phone screens up through wide
  desktop viewports; controls stack into a touch-friendly single column below
  480px.

## How to use it

1. Open `tech-digest-agent.html` inside a Claude.ai artifact (see
   **Important: where this runs**, below).
2. Optionally narrow the scope with the dropdown (all categories / models /
   products / algorithms).
3. Click **generate latest issue**. Each lane shows a live "searching…"
   status with an elapsed timer; sections fill in as they complete.
4. Once at least one lane succeeds, the download icon (↓) becomes active and
   a format dropdown appears next to it. Pick `.md` or `.html` and click the
   icon to save the issue. HTML downloads always use the dark newsletter theme.

## Important: where this runs

This tool calls `https://api.anthropic.com/v1/messages` directly from the
browser, with Claude's web search tool enabled. That request only succeeds
inside a Claude.ai artifact (or another Claude surface that provides the same
proxy), which securely injects the necessary credentials without exposing an
API key in the page itself.

**Opening this file directly in a plain browser (double-clicking it on your
desktop) will not work** — there's no API key configured client-side, so the
fetch call will fail. Keep it running inside the artifact environment it was
built for.

## Customizing

Everything lives in one file, so customization means editing CSS variables or
a few small JS functions directly.

**Colors** — the UI palette is defined as CSS custom properties near the top of
the `<style>` block (`:root`). The downloadable / emailed newsletter HTML uses
a fixed dark palette (`NEWSLETTER_DARK` in the script, and matching inline
colors in `agent/src/render.mjs`) so exports stay dark regardless of UI tweaks.

**Category focus / prompts** — the `categoryPrompt(cat, today)` function in
the `<script>` block controls what each lane searches for and how many items
it asks for (default: 3–4 per lane). Edit the `focus` object there to change
what counts as a "model," "algorithm," or "product" entry.

**Timeout** — the overall per-run timeout is set via `overallTimeoutMs` inside
`generateIssue()` (default 75000 ms / 75s).

**Model** — API calls use `claude-sonnet-4-6`. Change the `model` field inside
`fetchCategory()` to point at a different model string if needed.

## Known limitations

- **Session-only** — nothing persists. Reloading the page clears the current
  issue; there's no local storage or backend.
- **No scheduling** — this generates an issue on demand when you click the
  button. It doesn't run on a timer or send email. Turning this into an
  automatically-recurring, emailed newsletter would mean moving the same
  prompt/logic into a script (e.g. a scheduled job) that calls the Anthropic
  API server-side and pipes the result to an email service.
- **Search quality varies** — results depend on what's indexed and available
  at generation time; always check the linked source before citing an entry.
- **Three API calls per run** — one per lane (fewer if you scope to a single
  category), each doing a small number of web searches.

## Scheduled newsletter (automation)

Two ways to generate and email `/dev/digest` on a timer:

1. **Cursor Automation (preferred)** — paste the config in
   [`.cursor/automations/newsletter.md`](.cursor/automations/newsletter.md)
   at [cursor.com/automations](https://cursor.com/automations), on the **1st of
   each month at 09:00 IST** (`CRON_TZ=Asia/Kolkata 0 9 1 * *`). No run limit —
   each month generates and emails a new digest identified by date (no issue
   numbers). Uses this environment’s SMTP secrets.
2. **GitHub Actions fallback** —
   [`.github/workflows/newsletter.yml`](.github/workflows/newsletter.yml)
   runs `agent/` on the **1st of each month at 09:00 IST** (`30 3 1 * *` UTC)
   with no send cap.

### Agent CLI

```bash
npm install --prefix agent
# preview only (writes agent/out/)
npm run generate --prefix agent
# send for real (needs SMTP secrets below)
npm start --prefix agent
```

Secrets (Cursor environment and/or GitHub Actions):

- `SMTP_HOST`
- `SMTP_PORT` (e.g. `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (e.g. `/dev/digest <news@example.com>`)
- `NEWSLETTER_TO_EMAILS`

Optional: `SMTP_SECURE`, `SMTP_REPLY_TO`

## File structure

```
tech-digest-agent.html              browser artifact UI
agent/                              Node newsletter generator + SMTP sender
.github/workflows/newsletter.yml
.cursor/automations/newsletter.md
README.md
```
