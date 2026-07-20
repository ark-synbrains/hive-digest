# Automation: Send /dev/digest newsletter

Copy this into a new Cursor Automation at
[cursor.com/automations/new](https://cursor.com/automations/new)
(or use `/automate` in a local Cursor session).

## Configuration

| Setting | Value |
|---------|-------|
| **Name** | Send /dev/digest newsletter |
| **Trigger** | Scheduled — cron `0 */12 * * *` (every 12 hours UTC) |
| **Repository** | Single repo: `ark-synbrains/dev-digest` (branch `main`) |
| **Tools** | Disable pull-request creation (this run should not open PRs) |
| **Model** | Any capable cloud-agent model |

### Required environment secrets

Configure these in the Cloud Agent environment used by the automation:

- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY` — create at [resend.com/api-keys](https://resend.com/api-keys)
- `NEWSLETTER_TO_EMAILS` — comma-separated, e.g. `a@x.com,b@y.com`
- Optional: `RESEND_FROM_EMAIL`, `NEWSLETTER_REPLY_TO`

## Prompt (paste as automation instructions)

```
You are the /dev/digest newsletter agent.

Goal: generate a fresh tech digest issue and email it via Resend to every
address in NEWSLETTER_TO_EMAILS.

Do exactly this, then stop:

1. Work in the checked-out ark-synbrains/dev-digest repository on main
   (or the automation's configured branch). Do not open a pull request.
2. Confirm required env vars are present:
   ANTHROPIC_API_KEY, RESEND_API_KEY, NEWSLETTER_TO_EMAILS.
   If any are missing, report which ones and exit without inventing values.
3. From the repo root:
     cd agent
     npm ci
     npm start
4. Capture the command output. Success means every recipient was delivered.
   If the process exits non-zero or reports partial failures, surface the
   error and do not retry more than once.
5. Reply with a short run summary only:
   - issue date / subject line
   - recipient count
   - delivered vs failed
   - any lane generation errors

Never commit, push, or modify source files unless npm install requires a
lockfile refresh (prefer not to). Never send to addresses outside
NEWSLETTER_TO_EMAILS.
```
