/**
 * Build a styled HTML + plain-text newsletter and send it with Resend.
 */

import { Resend } from 'resend';
import { SECTION_META } from './generate.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hashFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).slice(0, 7);
}

export function buildMarkdown(issue) {
  const order = ['model', 'algorithm', 'product'];
  let md = `# /dev/digest — issue #${String(issue.number).padStart(3, '0')}\n\n`;
  md += `_${issue.date}_\n\n`;
  for (const cat of order) {
    const items = issue.byCategory[cat];
    if (!items?.length) continue;
    md += `## ${(issue.sectionMeta || SECTION_META)[cat].label}\n\n`;
    for (const it of items) {
      md += `**${it.headline || 'untitled update'}**\n\n`;
      md += `${it.summary || ''}\n\n`;
      md += `Source: [${it.source_name || 'source'}](${it.source_url || '#'})\n\n`;
      md += `---\n\n`;
    }
  }
  return md;
}

export function buildHtmlEmail(issue) {
  const order = ['model', 'algorithm', 'product'];
  const stamp = String(issue.number).padStart(3, '0');
  const meta = issue.sectionMeta || SECTION_META;

  let sections = '';
  for (const cat of order) {
    const items = issue.byCategory[cat];
    if (!items?.length) continue;
    sections += `
      <tr><td style="padding:28px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #2B3836;margin-bottom:16px;">
          <tr>
            <td style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:#5FBE87;letter-spacing:0.08em;text-transform:uppercase;padding-bottom:8px;">
              ${escapeHtml(meta[cat].label)}
            </td>
            <td align="right" style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:#8CA39A;padding-bottom:8px;">
              ${items.length} entr${items.length === 1 ? 'y' : 'ies'}
            </td>
          </tr>
        </table>`;

    for (const it of items) {
      const hash = hashFor((it.headline || '') + (it.source_url || ''));
      sections += `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1A2423;border:1px solid #2B3836;border-radius:6px;margin-bottom:12px;">
          <tr><td style="padding:16px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;color:#7FD9A0;">+ ${escapeHtml(cat)}</td>
                <td align="right" style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;color:#8CA39A;">#${hash}</td>
              </tr>
            </table>
            <h3 style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;margin:8px 0 6px;line-height:1.3;color:#E6E8E1;">
              ${escapeHtml(it.headline || 'untitled update')}
            </h3>
            <p style="font-family:system-ui,-apple-system,sans-serif;font-size:14.5px;line-height:1.55;margin:0 0 8px;color:#E6E8E1;">
              ${escapeHtml(it.summary || '')}
            </p>
            <p style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;margin:0;">
              <a href="${escapeHtml(it.source_url || '#')}" style="color:#8CA39A;text-decoration:none;border-bottom:1px dotted #2B3836;">
                ${escapeHtml(it.source_name || 'source')} ↗
              </a>
            </p>
          </td></tr>
        </table>`;
    }
    sections += `</td></tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>/dev/digest — issue #${stamp}</title>
</head>
<body style="margin:0;padding:0;background:#0F1516;color:#E6E8E1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F1516;">
    <tr><td align="center" style="padding:32px 16px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#0F1516;">
        <tr><td>
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:600;letter-spacing:-0.01em;margin:0 0 8px;color:#E6E8E1;">
            <span style="color:#5FBE87;font-weight:400;">/</span>dev<span style="color:#5FBE87;font-weight:400;">/</span>digest
          </h1>
          <p style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:#8CA39A;margin:0 0 4px;">
            issue <span style="color:#5FBE87;">#${stamp}</span> — ${escapeHtml(issue.date)}
          </p>
          <p style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12.5px;color:#8CA39A;border-bottom:1px solid #2B3836;padding-bottom:22px;margin:0 0 8px;letter-spacing:0.02em;">
            # a changelog for the world's tech stack — models, algorithms, releases
          </p>
        </td></tr>
        ${sections}
        <tr><td style="padding-top:36px;border-top:1px solid #2B3836;margin-top:28px;">
          <p style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;color:#8CA39A;line-height:1.6;margin:16px 0 0;">
            Generated by the /dev/digest agent from live web search — verify against primary sources before citing.
            You are receiving this because this address is on the NEWSLETTER_TO_EMAILS recipient list.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send the newsletter to one or more recipients via Resend.
 * Delivers individually so addresses stay private and failures are per-recipient.
 *
 * @param {{ apiKey: string, from: string, to: string|string[], replyTo?: string, issue: object }} opts
 */
export async function sendNewsletter({ apiKey, from, to, replyTo, issue }) {
  const recipients = Array.isArray(to)
    ? to
    : String(to || '')
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error('No recipients provided to sendNewsletter');
  }

  const stamp = String(issue.number).padStart(3, '0');
  const subject = `/dev/digest #${stamp} — ${issue.isoDate}`;
  const html = buildHtmlEmail(issue);
  const text = buildMarkdown(issue);
  const resend = new Resend(apiKey);

  const results = [];
  const failures = [];

  for (const recipient of recipients) {
    const idempotencyKey = `dev-digest/${issue.isoDate}/${stamp}/${recipient}`;
    try {
      const payload = {
        from,
        to: [recipient],
        subject,
        html,
        text,
        tags: [
          { name: 'product', value: 'dev-digest' },
          { name: 'issue_date', value: issue.isoDate },
        ],
      };
      if (replyTo) payload.replyTo = replyTo;

      const { data, error } = await resend.emails.send(payload, {
        idempotencyKey,
      });

      if (error) {
        failures.push({ to: recipient, error: error.message });
        continue;
      }

      results.push({
        to: recipient,
        id: data?.id,
        idempotencyKey,
      });
    } catch (err) {
      failures.push({
        to: recipient,
        error: err?.message || String(err),
      });
    }
  }

  if (results.length === 0) {
    const detail = failures.map((f) => `${f.to}: ${f.error}`).join('; ');
    throw new Error(`Resend send failed for all recipients — ${detail}`);
  }

  return {
    subject,
    sent: results,
    failed: failures,
    id: results.map((r) => r.id).join(','),
  };
}
