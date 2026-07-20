const SECTION_META = {
  model: { label: 'models & research', tag: 'model' },
  algorithm: { label: 'algorithms & systems', tag: 'algorithm' },
  product: { label: 'product & company releases', tag: 'product' },
};

const ORDER = ['model', 'algorithm', 'product'];

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function teaser(byCategory) {
  const first = ORDER.map((k) => (byCategory[k] || [])[0]?.headline).filter(Boolean);
  if (!first.length) return 'latest technical updates';
  return first
    .slice(0, 3)
    .map((h) => h.split(/[:—-]/)[0].trim())
    .join(', ');
}

export function buildIssue({ number, date, byCategory }) {
  const nnn = String(number).padStart(3, '0');
  const subject = `/dev/digest #${nnn} — ${teaser(byCategory)} (${date})`;

  let text = `/dev/digest — issue #${nnn}\n${date}\n\n`;
  text += 'A changelog of recent models, algorithms, and product releases for hands-on engineers.\n\n';

  for (const cat of ORDER) {
    const items = byCategory[cat] || [];
    if (!items.length) continue;
    text += `## ${SECTION_META[cat].label}\n\n`;
    for (const it of items) {
      text += `${it.headline}\n${it.summary}\nSource: ${it.source_name} — ${it.source_url}\n\n`;
    }
  }
  text += '— /dev/digest\n';

  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>/dev/digest #${nnn}</title></head>`;
  html += `<body style="margin:0;padding:0;background:#0F1516;color:#E6E8E1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">`;
  html += `<div style="max-width:640px;margin:0 auto;padding:40px 20px 72px;">`;
  html += `<div style="border-bottom:1px solid #2B3836;padding-bottom:20px;margin-bottom:28px;">`;
  html += `<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:600;letter-spacing:-0.01em;"><span style="color:#5FBE87;font-weight:400;">/</span>dev/digest</h1>`;
  html += `<p style="margin:10px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#8CA39A;line-height:1.6;">issue <span style="color:#5FBE87;">#${nnn}</span><br/>${escapeHtml(date)}</p>`;
  html += `<p style="margin:14px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:#8CA39A;">models · algorithms · product releases — with source links</p>`;
  html += `</div>`;

  for (const cat of ORDER) {
    const items = byCategory[cat] || [];
    if (!items.length) continue;
    html += `<div style="margin-bottom:36px;">`;
    html += `<div style="border-bottom:1px solid #2B3836;padding-bottom:8px;margin-bottom:18px;">`;
    html += `<span style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5FBE87;">${escapeHtml(SECTION_META[cat].label)}</span>`;
    html += `<span style="float:right;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#8CA39A;">${items.length} entr${items.length === 1 ? 'y' : 'ies'}</span>`;
    html += `</div>`;
    items.forEach((it, idx) => {
      const last = idx === items.length - 1;
      html += `<div style="margin-bottom:${last ? '8' : '22'}px;">`;
      html += `<div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#8CA39A;margin-bottom:6px;"><span style="color:#7FD9A0;">${SECTION_META[cat].tag}</span></div>`;
      html += `<h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:600;line-height:1.3;">${escapeHtml(it.headline)}</h2>`;
      html += `<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#E6E8E1;">${escapeHtml(it.summary)}</p>`;
      html += `<a href="${escapeHtml(it.source_url)}" style="font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#5FBE87;text-decoration:none;">${escapeHtml(it.source_name)} ↗</a>`;
      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `<p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#8CA39A;border-top:1px solid #2B3836;padding-top:18px;">— /dev/digest<br/>Generated for engineers who want source links, not vibes.</p>`;
  html += `</div></body></html>`;

  return { subject, text, html, number, date };
}
