import nodemailer from 'nodemailer';

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing required env: ${name}`);
  return String(v).trim();
}

function optionalEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === null || !String(v).trim()) return fallback;
  return String(v).trim();
}

function parseBool(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return fallback;
}

/**
 * Build a nodemailer transport from SMTP_* environment variables.
 *
 * Required: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Optional: SMTP_PORT (default 587), SMTP_SECURE (default true when port=465),
 *           SMTP_REPLY_TO
 */
export function getSmtpConfig() {
  const host = requireEnv('SMTP_HOST');
  const port = Number(optionalEnv('SMTP_PORT', '587'));
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid SMTP_PORT: ${process.env.SMTP_PORT}`);
  }
  const secure = parseBool(process.env.SMTP_SECURE, port === 465);
  const user = requireEnv('SMTP_USER');
  const pass = requireEnv('SMTP_PASS');
  const from = requireEnv('SMTP_FROM');
  const replyTo = optionalEnv('SMTP_REPLY_TO');

  return { host, port, secure, user, pass, from, replyTo };
}

export function createTransport(config = getSmtpConfig()) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

/**
 * Send an HTML+text email via SMTP.
 * @returns {{ messageId: string, accepted: string[], rejected: string[] }}
 */
export async function sendSmtpEmail({ to, subject, text, html, headers = {} }) {
  const config = getSmtpConfig();
  const transport = createTransport(config);

  const info = await transport.sendMail({
    from: config.from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html,
    replyTo: config.replyTo,
    headers,
  });

  return {
    messageId: info.messageId || null,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    response: info.response || null,
  };
}
