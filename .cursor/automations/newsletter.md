# Cursor Automation — Hive Digest newsletter

Use this when creating the automation at [cursor.com/automations/new](https://cursor.com/automations/new) or via `/automate` in a local Cursor session.

> Cloud agents in this environment could not create the automation via the web UI (Cloudflare bot check). Paste the settings below once in the dashboard to activate the Cursor-native schedule. The repo also includes a GitHub Actions fallback (`.github/workflows/newsletter.yml`).

## Settings

| Field | Value |
| --- | --- |
| **Name** | Hive Digest (monthly) |
| **Trigger** | Scheduled → Custom cron (monthly, 1st at 09:00 IST): `CRON_TZ=Asia/Kolkata 0 9 1 * *` |
| **Repository** | `ark-synbrains/dev-digest` @ `main` |
| **Environment** | `ark-synbrains/dev-digest` (needs SMTP + recipient secrets — see below) |
| **Tools** | Memories on · PR creation off |
| **Model** | Any current cloud-agent model |

### Required environment secrets

- `SMTP_HOST`
- `SMTP_PORT` (e.g. `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (e.g. `Hive Digest <news@example.com>`)
- `NEWSLETTER_TO_EMAILS`

Optional: `SMTP_SECURE`, `SMTP_REPLY_TO`

## Prompt

```
You are the Hive Digest newsletter automation for repo ark-synbrains/dev-digest (brand: Synbrains Hive — https://hive.synbrains.ai/).

## Task
Every scheduled run (monthly): generate a fresh Hive Digest and email it via SMTP.
There is no run limit — always generate and send unless SMTP/env is missing or generation fails after the allowed retry.
Do not use issue numbers — identify each digest by its date only.
Do not open a PR or create a feature branch for a normal successful send.

### Content
- Pull CURRENT developments from the web across three lanes (≈3 entries each after ranking):
  1. models & research
  2. algorithms & systems
  3. product & company releases
- Each entry: headline, 2–4 sentence engineer-focused summary, source_name, source_url (real links only).
- Tone: Synbrains Hive insights for hands-on engineers. Match tech-digest-agent.html / Hive branding (red #EE462F → purple #7610C7 on dark).
- The emailed HTML newsletter must always use the dark Hive theme (do not switch to light).
- Subject: `Hive Digest - DD Mon YYYY`
  - Example: `Hive Digest - 21 Jul 2026`
  - Date is the issue identity (DD Mon YYYY). No #NNN issue numbers; no teaser in subject.
- NEVER include insight scores in the email body/subject. Scores are ranking-only.

### Preferred implementation
- Always use the Node agent (do not reimplement research/ranking/email by hand):
  `npm install --prefix agent && npm start --prefix agent`
- What the agent already does (trust logs; do not abort early on warnings):
  - Researches via HN Algolia + arXiv, with OpenAlex as a paper backup.
  - Retries transient 429 / 408 / 425 / 5xx (and soft bodies like "Rate exceeded." / invalid JSON under load) with backoff and Retry-After.
  - Paces requests per host (arXiv ≥3s; mild gaps for HN / OpenAlex) and times out hung requests.
  - Opens a per-host circuit after an exhausted rate-limit cycle so backups do not keep hammering that host.
  - Soft-fails individual queries so one upstream cannot abort the whole run.
  - Falls back across sources: arXiv → OpenAlex → HN-only; each HN lane has alternate queries if the primary is empty/failing.
  - Validates entries, scores insight value, ranks high→low, orders sections by average score (scores logged only, never emailed).
  - Sanitizes newsletter text/HTML before SMTP send.
- Sending uses nodemailer SMTP with env secrets:
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
  - NEWSLETTER_TO_EMAILS (comma/semicolon-separated)
  - optional SMTP_SECURE, SMTP_REPLY_TO
- Do not use Resend or the Resend MCP.
- Ignore any prior memory about /dev/digest naming, issue numbers, hourly schedules, a "1-run trial", or "fail immediately on arXiv 429".

### Success criteria
- Treat the run as success when `npm start` prints ok:true with a messageId (or SMTP accepted recipients), even if logs warn about:
  - OpenAlex backup
  - HN-only fallback
  - alternate HN queries
  - per-host circuit open / rate-limit backoff
- Still send whenever the digest has entries after ranking.

### After success
Update memories: store subject, date, SMTP messageId, and last_success_at.
Clear or supersede any prior last_error / last_error_at from a previous failed run.
Report date and messageId (not an issue number, not scores).
If a paper-source backup was used (OpenAlex / HN-only) or a host circuit opened, mention that briefly in the success report and memory.

### Failure
Do not pretend success. Record the error in memory and stop.
Hard failures are only: missing SMTP/env, zero entries after ranking, or SMTP reject after the retry below.
If `npm start` fails once on a transient upstream / network error (including rate limits that exhausted in-process retries), wait ~30s and retry `npm start --prefix agent` once before recording failure.
Do not keep retrying beyond that single outer retry.
```

## `/automate` one-liner (local Cursor)

```
/automate On the 1st of every month at 09:00 IST (cron: CRON_TZ=Asia/Kolkata 0 9 1 * *), generate the Hive Digest for ark-synbrains/dev-digest (hive.synbrains.ai branding) and email it via SMTP using SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM and NEWSLETTER_TO_EMAILS. Prefer `npm start --prefix agent` (it already retries/falls back across HN, arXiv, and OpenAlex — warnings are OK if entries exist). Validate and rank by insight score without showing scores. Newsletter HTML must always be dark Hive theme. No PRs for normal sends; on transient npm start failure wait ~30s and retry once.
```
