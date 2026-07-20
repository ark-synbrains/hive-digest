# Cursor Automation — `/dev/digest` hourly newsletter

Use this when creating the automation at [cursor.com/automations/new](https://cursor.com/automations/new) or via `/automate` in a local Cursor session.

> Cloud agents in this environment could not create the automation via the web UI (Cloudflare bot check). Paste the settings below once in the dashboard to activate the Cursor-native schedule. The repo also includes a GitHub Actions fallback (`.github/workflows/dev-digest-hourly.yml`).

## Settings

| Field | Value |
| --- | --- |
| **Name** | `/dev/digest` hourly newsletter |
| **Trigger** | Scheduled → Custom cron (every hour IST): `CRON_TZ=Asia/Kolkata 0 * * * *` |
| **Trial** | Leave enabled for **2 hourly runs**, then disable (or keep the prompt’s memory-based 2-run guard) |
| **Repository** | `ark-synbrains/dev-digest` @ `main` |
| **Environment** | `ark-synbrains/dev-digest` (has `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEWSLETTER_TO_EMAILS`) |
| **Tools** | Memories on · MCP / Resend on · PR creation optional/off |
| **Model** | Any current cloud-agent model |

## Prompt

```
You are the /dev/digest newsletter automation for repo ark-synbrains/dev-digest.

## Run limit (trial)
Only successfully generate+send TWICE total.
1. Read automation memories for `digest_runs_completed` (integer, default 0).
2. If digest_runs_completed >= 2: do NOT generate or send. Reply that the 2-run trial is complete and the automation should be disabled. Stop.
3. Otherwise continue.

## Task
Generate a fresh /dev/digest technical newsletter and email it with Resend.

### Content
- Pull CURRENT developments from the web across three lanes (≈3 entries each):
  1. models & research
  2. algorithms & systems
  3. product & company releases
- Each entry: headline, 2–4 sentence engineer-focused summary, source_name, source_url (real links only).
- Tone: changelog for hands-on engineers. Match tech-digest-agent.html / prior /dev/digest issues.
- Subject: `/dev/digest #NNN — <short teaser> (<date>)`
  - NNN from memory `digest_issue_number` (start at 2 if unset; #001 was sent manually).

### Preferred implementation
- If `agent/` exists: `npm install --prefix agent && DIGEST_MAX_RUNS=0 npm start --prefix agent`
  (uses env secrets already injected into this environment).
- Otherwise: research via web search, then send with Resend MCP `send-email`.
  - from: env `RESEND_FROM_EMAIL`
  - to: parse env `NEWSLETTER_TO_EMAILS`
  - include html + text; dark theme (bg #0F1516, accent #5FBE87)
  - idempotency key: `dev-digest/issue-<NNN>/<YYYY-MM-DD-HH>`

### After success
Update memories: increment `digest_runs_completed`, set `digest_issue_number`, store subject + Resend id.
Report issue number, Resend id, and remaining trial runs.

### Failure
Do not pretend success. Record the error in memory and stop.
```

## `/automate` one-liner (local Cursor)

```
/automate Every hour at :00 IST (cron: CRON_TZ=Asia/Kolkata 0 * * * *), generate the /dev/digest technical newsletter for ark-synbrains/dev-digest and email it with Resend using RESEND_FROM_EMAIL and NEWSLETTER_TO_EMAILS. Limit to 2 successful sends via memory, then stop. Prefer running npm start --prefix agent when available.
```
