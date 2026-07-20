# Cursor Automation — `/dev/digest` newsletter

Use this when creating the automation at [cursor.com/automations/new](https://cursor.com/automations/new) or via `/automate` in a local Cursor session.

> Cloud agents in this environment could not create the automation via the web UI (Cloudflare bot check). Paste the settings below once in the dashboard to activate the Cursor-native schedule. The repo also includes a GitHub Actions fallback (`.github/workflows/newsletter.yml`).

## Settings

| Field | Value |
| --- | --- |
| **Name** | `/dev/digest` newsletter |
| **Trigger** | Scheduled → Custom cron (monthly, 1st at 09:00 IST): `CRON_TZ=Asia/Kolkata 0 9 1 * *` |
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

## Task
Every scheduled run (monthly): generate a fresh /dev/digest technical newsletter and email it via SMTP.
There is no run limit — always generate and send unless SMTP/env is missing or generation fails.
Do not use issue numbers — identify each digest by its date only.

### Content
- Pull CURRENT developments from the web across three lanes (≈3 entries each):
  1. models & research
  2. algorithms & systems
  3. product & company releases
- Each entry: headline, 2–4 sentence engineer-focused summary, source_name, source_url (real links only).
- Tone: changelog for hands-on engineers. Match tech-digest-agent.html / prior /dev/digest issues.
- The emailed HTML newsletter must always use the dark theme (do not switch to light).
- Subject: `/dev/digest — <short teaser> (<date>)`
  - Date is the issue identity (e.g. Mon Jul 20 2026). No #NNN issue numbers.

### Preferred implementation
- Run: `npm install --prefix agent && npm start --prefix agent`
- Sending uses nodemailer SMTP with env secrets:
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
  - NEWSLETTER_TO_EMAILS (comma/semicolon-separated)
  - optional SMTP_SECURE, SMTP_REPLY_TO
- Do not use Resend or the Resend MCP.
- Ignore any prior memory about issue numbers, hourly schedules, or a "1-run trial". Always send on the monthly schedule.

### After success
Update memories: store subject, date, SMTP messageId, and last_success_at.
Report date and messageId (not an issue number).

### Failure
Do not pretend success. Record the error in memory and stop.
```

## `/automate` one-liner (local Cursor)

```
/automate On the 1st of every month at 09:00 IST (cron: CRON_TZ=Asia/Kolkata 0 9 1 * *), generate the /dev/digest technical newsletter for ark-synbrains/dev-digest and email it via SMTP using SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM and NEWSLETTER_TO_EMAILS. No run limit and no issue numbers — identify each send by date. Prefer running npm start --prefix agent when available. Newsletter HTML must always be dark theme.
```
