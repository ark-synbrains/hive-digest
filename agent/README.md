# /dev/digest newsletter agent

Server-side agent that generates a `/dev/digest` issue (same three lanes as
`tech-digest-agent.html`) and emails it to configured recipients via
[Resend](https://resend.com).

## Schedule

| Mode | How |
|------|-----|
| **Cursor Automation** | Create from [`.cursor/automations/send-dev-digest.md`](../.cursor/automations/send-dev-digest.md) at [cursor.com/automations/new](https://cursor.com/automations/new) — cron `0 */12 * * *` |
| **GitHub Actions** | `.github/workflows/newsletter.yml` runs on `0 */12 * * *` (every 12 hours UTC) and on manual `workflow_dispatch` |
| **Long-running process** | `npm run schedule` — loops every `NEWSLETTER_INTERVAL_HOURS` (default 12) |
| **One-shot** | `npm start` |

## Get a Resend API key (no SMTP account needed)

1. Sign up at [resend.com](https://resend.com) (free tier is enough to start)
2. Create an API key: [resend.com/api-keys](https://resend.com/api-keys)
3. For production sends, verify domain **newsletters.synbrains.ai** in
   [Resend Domains](https://resend.com/domains) and use
   `RESEND_FROM_EMAIL=/dev/digest <digest@newsletters.synbrains.ai>`
4. For a quick sandbox test without DNS, set
   `RESEND_FROM_EMAIL=/dev/digest <onboarding@resend.dev>` — that can only
   deliver to your Resend account email

## Configuration

Copy `.env.example` to `.env` (local) or set GitHub Actions / Cursor secrets:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | yes (live generate) | — | Anthropic Messages API + web search |
| `RESEND_API_KEY` | yes (send) | — | Resend API key |
| `RESEND_FROM_EMAIL` | yes (send) | `/dev/digest <digest@newsletters.synbrains.ai>` | Verified sending identity |
| `NEWSLETTER_TO_EMAILS` | yes | `archana.rk@synbrains.ai` | Comma/semicolon/whitespace-separated recipient list |
| `NEWSLETTER_TO_EMAIL` | no | — | Single-address fallback if `NEWSLETTER_TO_EMAILS` is unset |
| `NEWSLETTER_REPLY_TO` | no | — | Reply-To header |
| `NEWSLETTER_SCOPE` | no | `all` | `all` \| `models` \| `products` \| `algorithms` |
| `NEWSLETTER_INTERVAL_HOURS` | no | `12` | Scheduler interval |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Model id |

### Secrets checklist

- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `NEWSLETTER_TO_EMAILS` — e.g. `a@x.com,b@y.com`
- `RESEND_FROM_EMAIL` (optional if the default is correct)

## Local usage

```bash
cd agent
cp .env.example .env   # fill in Anthropic + Resend + NEWSLETTER_TO_EMAILS
npm install

# Generate + print markdown (no send)
npm run dry-run

# Generate with sample content + send to all recipients (needs RESEND_API_KEY)
NEWSLETTER_TO_EMAILS='a@x.com,b@y.com' node src/index.js --fixture

# Full live generate + send
npm start

# Run forever, every 12 hours
npm run schedule
```

## Idempotency

Each per-recipient send uses idempotency key
`dev-digest/<iso-date>/<issue>/<recipient>` so retries within 24 hours do not
duplicate the same issue to the same address.
