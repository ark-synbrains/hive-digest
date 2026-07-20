# /dev/digest newsletter agent

Server-side agent that generates a `/dev/digest` issue (same three lanes as
`tech-digest-agent.html`) and emails it to a configured address over **SMTP**
(via [Nodemailer](https://nodemailer.com)).

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
| `SMTP_HOST` | yes (send) | — | SMTP server hostname |
| `SMTP_PORT` | no | `587` | SMTP port (`465` if using implicit TLS) |
| `SMTP_SECURE` | no | `false` | `true` for port 465 |
| `SMTP_USER` | usually | — | SMTP auth username |
| `SMTP_PASS` | if user set | — | SMTP auth password / app password |
| `SMTP_FROM_EMAIL` | yes (send) | `/dev/digest <digest@newsletters.synbrains.ai>` | From header |
| `NEWSLETTER_TO_EMAIL` | yes | `archana.rk@synbrains.ai` | Recipient |
| `NEWSLETTER_REPLY_TO` | no | — | Reply-To header |
| `NEWSLETTER_SCOPE` | no | `all` | `all` \| `models` \| `products` \| `algorithms` |
| `NEWSLETTER_INTERVAL_HOURS` | no | `12` | Scheduler interval |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Model id |

### GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions:

- `ANTHROPIC_API_KEY`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL` (optional if the default from-address is correct)
- `SMTP_PORT` / `SMTP_SECURE` (optional)
- `NEWSLETTER_TO_EMAIL` (optional if the default recipient is correct)

### Example providers

| Provider | Typical settings |
|----------|------------------|
| Gmail (app password) | host `smtp.gmail.com`, port `587`, secure `false` |
| Microsoft 365 | host `smtp.office365.com`, port `587`, secure `false` |
| Amazon SES SMTP | host `email-smtp.<region>.amazonaws.com`, port `587` |
| Mailgun / Postmark / etc. | use that provider’s SMTP credentials |

Use an address your SMTP provider allows you to send from for `SMTP_FROM_EMAIL`.

## Local usage

```bash
cd agent
cp .env.example .env   # fill in Anthropic + SMTP settings
npm install

# Generate + print markdown (no send)
npm run dry-run

# Generate with sample content + send (needs SMTP_*)
node src/index.js --fixture

# Full live generate + send
npm start

# Run forever, every 12 hours
npm run schedule
```

## Message identity

Each send sets `Message-ID` / `X-Entity-Ref-ID` from the issue date so clients
can tell issues apart. SMTP itself does not offer Resend-style idempotency;
avoid overlapping workflow runs if you need exactly-once delivery.
