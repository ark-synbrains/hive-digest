/**
 * Hive Digest email renderer - Synbrains / hive.synbrains.ai branding.
 * Newsletter HTML is always dark; insight scores are never shown.
 */

import { sanitizeDigestEntries, sanitizeIssue, sanitizeNewsletterText } from './sanitize.mjs';

const HIVE = {
  bg: '#0B0A12',
  card: '#161222',
  hairline: '#2A2438',
  ink: '#F3F0F7',
  inkDim: '#A39BB3',
  red: '#EE462F',
  purple: '#7610C7',
  site: 'https://hive.synbrains.ai/',
};

const SECTION_META = {
  model: { label: 'models & research', tag: 'model' },
  algorithm: { label: 'algorithms & systems', tag: 'algorithm' },
  product: { label: 'product & company releases', tag: 'product' },
};

const DEFAULT_ORDER = ['model', 'algorithm', 'product'];

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function accentBar() {
  return `<div style="height:4px;border-radius:999px;background:linear-gradient(90deg,${HIVE.red},${HIVE.purple});margin:0 0 22px;"></div>`;
}

export function buildIssue({ date, byCategory, sectionOrder }) {
  const clean = sanitizeDigestEntries(byCategory);
  const cleanDate = sanitizeNewsletterText(date);
  const order = (sectionOrder?.length ? sectionOrder : DEFAULT_ORDER).filter(
    (k) => (clean[k] || []).length
  );
  // Keep subject short and branded: Hive Digest - DD Mon YYYY
  const subject = `Hive Digest - ${cleanDate}`;

  let text = `Hive Digest\n${cleanDate}\n${HIVE.site}\n\n`;
  text += 'AI & technology insights from Synbrains - models, algorithms, and product releases.\n\n';

  for (const cat of order) {
    const items = clean[cat] || [];
    if (!items.length) continue;
    text += `## ${SECTION_META[cat].label}\n\n`;
    for (const it of items) {
      text += `${it.headline}\n${it.summary}\nSource: ${it.source_name} - ${it.source_url}\n\n`;
    }
  }
  text += `- Hive Digest - Synbrains\n${HIVE.site}\n`;

  // Always dark theme for the emailed newsletter.
  let html = `<!DOCTYPE html><html lang="en" data-theme="dark" style="color-scheme:dark;"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="dark only"/><meta name="supported-color-schemes" content="dark"/><title>Hive Digest - ${escapeHtml(cleanDate)}</title><style>:root{color-scheme:dark only;}@media (prefers-color-scheme:light){body{background:${HIVE.bg}!important;color:${HIVE.ink}!important;}}</style></head>`;
  html += `<body style="margin:0;padding:0;background:${HIVE.bg};color:${HIVE.ink};color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">`;
  html += `<div style="max-width:640px;margin:0 auto;padding:40px 20px 72px;background:${HIVE.bg};color:${HIVE.ink};">`;
  html += accentBar();
  html += `<div style="border-bottom:1px solid ${HIVE.hairline};padding-bottom:20px;margin-bottom:28px;">`;
  html += `<p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;"><span style="color:${HIVE.red};">Hive</span> <span style="color:${HIVE.inkDim};">by Synbrains</span></p>`;
  html += `<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:600;letter-spacing:-0.02em;color:${HIVE.ink};">Hive Digest</h1>`;
  html += `<p style="margin:10px 0 0;font-size:13px;color:${HIVE.purple};line-height:1.6;">${escapeHtml(cleanDate)}</p>`;
  html += `<p style="margin:14px 0 0;font-size:13px;color:${HIVE.inkDim};line-height:1.55;">Your gateway to the latest in AI &amp; technology - with source links.</p>`;
  html += `</div>`;

  for (const cat of order) {
    const items = clean[cat] || [];
    if (!items.length) continue;
    html += `<div style="margin-bottom:36px;">`;
    html += `<div style="border-bottom:1px solid ${HIVE.hairline};padding-bottom:8px;margin-bottom:18px;">`;
    html += `<span style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${HIVE.red};font-weight:600;">${escapeHtml(SECTION_META[cat].label)}</span>`;
    html += `<span style="float:right;font-size:11px;color:${HIVE.inkDim};">${items.length} entr${items.length === 1 ? 'y' : 'ies'}</span>`;
    html += `</div>`;
    items.forEach((it, idx) => {
      const last = idx === items.length - 1;
      html += `<div style="margin-bottom:${last ? '8' : '22'}px;padding:16px 16px;background:${HIVE.card};border:1px solid ${HIVE.hairline};border-radius:10px;">`;
      html += `<div style="font-size:11px;color:${HIVE.inkDim};margin-bottom:6px;"><span style="color:${HIVE.purple};">${SECTION_META[cat].tag}</span></div>`;
      html += `<h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:600;line-height:1.3;color:${HIVE.ink};">${escapeHtml(it.headline)}</h2>`;
      html += `<p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${HIVE.ink};">${escapeHtml(it.summary)}</p>`;
      html += `<a href="${escapeHtml(it.source_url)}" style="font-size:12px;color:${HIVE.red};text-decoration:none;font-weight:600;">${escapeHtml(it.source_name)} -></a>`;
      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `<p style="margin:0;font-size:12px;color:${HIVE.inkDim};border-top:1px solid ${HIVE.hairline};padding-top:18px;line-height:1.6;">- Hive Digest - Synbrains<br/><a href="${HIVE.site}" style="color:${HIVE.purple};text-decoration:none;">${HIVE.site.replace(/^https:\/\//, '')}</a><br/>Expert insights on AI, technology &amp; innovation.</p>`;
  html += `</div></body></html>`;

  return sanitizeIssue({ subject, text, html, date: cleanDate });
}
