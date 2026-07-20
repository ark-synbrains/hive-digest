/**
 * Build a styled HTML + plain-text newsletter and send it over SMTP.
 */

import nodemailer from 'nodemailer';
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
            You are receiving this because this address is configured as NEWSLETTER_TO_EMAIL.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendNewsletter({ smtp, from, to, replyTo, issue }) {
  const stamp = String(issue.number).padStart(3, '0');
  const subject = `/dev/digest #${stamp} — ${issue.isoDate}`;
  const html = buildHtmlEmail(issue);
  const text = buildMarkdown(issue);
  const messageId = `<dev-digest-${issue.isoDate}-${stamp}@newsletter>`;

  const transportOptions = {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
  };
  if (smtp.user) {
    transportOptions.auth = { user: smtp.user, pass: smtp.pass };
  }

  const transporter = nodemailer.createTransport(transportOptions);

  const info = await transporter.sendMail({
    from,
    to,
    replyTo,
    subject,
    text,
    html,
    messageId,
    headers: {
      'X-Entity-Ref-ID': `dev-digest/${issue.isoDate}/${stamp}`,
    },
  });

  return {
    id: info.messageId || messageId,
    subject,
    response: info.response,
  };
}
