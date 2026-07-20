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
| **Environment** | `ark-synbrains/dev-digest` (needs SMTP + recipient secrets — see below) |
| **Tools** | Memories on · PR creation optional/off |
| **Model** | Any current cloud-agent model |

### Required environment secrets

- `SMTP_HOST`
- `SMTP_PORT` (e.g. `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (e.g. `/dev/digest <news@example.com>`)
- `NEWSLETTER_TO_EMAILS`

Optional: `SMTP_SECURE`, `SMTP_REPLY_TO`

## Prompt

```
You are the /dev/digest newsletter automation for repo ark-synbrains/dev-digest.

## Run limit (trial)
Only successfully generate+send TWICE total.
1. Read automation memories for `digest_runs_completed` (integer, default 0).
2. If digest_runs_completed >= 2: do NOT generate or send. Reply that the 2-run trial is complete and the automation should be disabled. Stop.
3. Otherwise continue.

## Task
Generate a fresh /dev/digest technical newsletter and email it via SMTP.

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
- Run: `npm install --prefix agent && DIGEST_MAX_RUNS=0 npm start --prefix agent`
- Sending uses nodemailer SMTP with env secrets:
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
  - NEWSLETTER_TO_EMAILS (comma/semicolon-separated)
  - optional SMTP_SECURE, SMTP_REPLY_TO
- Do not use Resend or the Resend MCP.

### After success
Update memories: increment `digest_runs_completed`, set `digest_issue_number`, store subject + SMTP messageId.
Report issue number, messageId, and remaining trial runs.

### Failure
Do not pretend success. Record the error in memory and stop.
```

## `/automate` one-liner (local Cursor)

```
/automate Every hour at :00 IST (cron: CRON_TZ=Asia/Kolkata 0 * * * *), generate the /dev/digest technical newsletter for ark-synbrains/dev-digest and email it via SMTP using SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM and NEWSLETTER_TO_EMAILS. Limit to 2 successful sends via memory, then stop. Prefer running npm start --prefix agent when available.
```
