# /dev/digest newsletter agent

Server-side agent that generates a `/dev/digest` issue (same three lanes as
`tech-digest-agent.html`) and emails it to a configured address via [Resend](https://resend.com).

## Schedule

| Mode | How |
|------|-----|
| **GitHub Actions (recommended)** | `.github/workflows/newsletter.yml` runs on `0 */12 * * *` (every 12 hours UTC) and on manual `workflow_dispatch` |
| **Long-running process** | `npm run schedule` — loops every `NEWSLETTER_INTERVAL_HOURS` (default 12) |
| **One-shot** | `npm start` |

## Configuration

Copy `.env.example` to `.env` (local) or set GitHub Actions secrets/variables:

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | yes (live generate) | — | Anthropic Messages API + web search |
| `RESEND_API_KEY` | yes (send) | — | Resend send API |
| `NEWSLETTER_TO_EMAIL` | yes | `archana.rk@synbrains.ai` | Recipient |
| `RESEND_FROM_EMAIL` | yes | `/dev/digest <digest@newsletters.synbrains.ai>` | Verified sending identity |
| `NEWSLETTER_REPLY_TO` | no | — | Reply-To header |
| `NEWSLETTER_SCOPE` | no | `all` | `all` \| `models` \| `products` \| `algorithms` |
| `NEWSLETTER_INTERVAL_HOURS` | no | `12` | Scheduler interval |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Model id |

### GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions:

- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `NEWSLETTER_TO_EMAIL` (optional if the default recipient is correct)
- `RESEND_FROM_EMAIL` (optional if the default from-address is correct)

## Sending domain DNS

Resend domain: **newsletters.synbrains.ai** (must be verified before production sends).

Add these DNS records at your DNS provider:

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | `resend._domainkey.newsletters` | *(DKIM value from Resend dashboard)* | — |
| MX | `send.newsletters` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send.newsletters` | `v=spf1 include:amazonses.com ~all` | — |

Then verify the domain in the Resend dashboard (or via API). Until verification
completes, sends from `@newsletters.synbrains.ai` will fail.

For sandbox testing without a verified domain, you can temporarily send from
` /dev/digest <onboarding@resend.dev>` — that address can only deliver to the
Resend account owner's email.

## Local usage

```bash
cd agent
cp .env.example .env   # fill in keys
npm install

# Generate + print markdown (no send)
npm run dry-run

# Generate with sample content + send (needs RESEND_API_KEY)
node src/index.js --fixture

# Full live generate + send
npm start

# Run forever, every 12 hours
npm run schedule
```

## Idempotency

Each send uses an idempotency key of the form
`dev-digest/<iso-date>/<issue>/<recipient>` so retries within 24 hours do not
duplicate the same issue to the same address.
