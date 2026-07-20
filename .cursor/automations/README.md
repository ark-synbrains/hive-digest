# Cursor Automations for /dev/digest

This folder documents Cursor Automations that drive the newsletter agent in
`agent/`. Cursor Automations are account/team objects (not auto-loaded from
git), so you still need to create them once in the UI.

## Send newsletter every 12 hours

1. Open [cursor.com/automations/new](https://cursor.com/automations/new)
2. Follow the settings in [`send-dev-digest.md`](./send-dev-digest.md)
3. Paste the prompt from that file
4. Attach repo `ark-synbrains/dev-digest`
5. Put `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, and `NEWSLETTER_TO_EMAILS` in the
   Cloud Agent environment secrets used by the automation
6. Save and enable

Alternatively, in a local Cursor chat on this repo, run `/automate` and say:

> Create a scheduled automation every 12 hours that runs `cd agent && npm ci && npm start` in ark-synbrains/dev-digest and emails the /dev/digest newsletter via Resend to NEWSLETTER_TO_EMAILS. Do not open a PR.

## Fallback without Cursor Automations

GitHub Actions already schedules the same agent:

`.github/workflows/newsletter.yml` → cron `0 */12 * * *`
