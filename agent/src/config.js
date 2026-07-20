/**
 * Runtime configuration for the newsletter agent.
 * All values come from environment variables so the recipient and
 * sending identity can be changed without code edits.
 */

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name, fallback = '') {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export function loadConfig({ requireSendSecrets = true } = {}) {
  const to = optional('NEWSLETTER_TO_EMAIL', 'archana.rk@synbrains.ai');
  const from = optional(
    'RESEND_FROM_EMAIL',
    '/dev/digest <digest@newsletters.synbrains.ai>'
  );
  const replyTo = optional('NEWSLETTER_REPLY_TO', '');
  const anthropicApiKey = optional('ANTHROPIC_API_KEY');
  const resendApiKey = optional('RESEND_API_KEY');
  const model = optional('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
  const scope = optional('NEWSLETTER_SCOPE', 'all'); // all | models | products | algorithms
  const intervalHours = Number(optional('NEWSLETTER_INTERVAL_HOURS', '12'));

  if (requireSendSecrets) {
    if (!anthropicApiKey) {
      throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
    }
    if (!resendApiKey) {
      throw new Error('Missing required environment variable: RESEND_API_KEY');
    }
  }

  if (!Number.isFinite(intervalHours) || intervalHours <= 0) {
    throw new Error('NEWSLETTER_INTERVAL_HOURS must be a positive number');
  }

  return {
    to,
    from,
    replyTo: replyTo || undefined,
    anthropicApiKey,
    resendApiKey,
    model,
    scope,
    intervalHours,
  };
}
