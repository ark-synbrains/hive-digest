/**
 * Normalize newsletter copy to plain ASCII-safe text for email clients.
 * Removes curly quotes, arrows, ellipses, zero-width chars, and other odd glyphs.
 */

const REPLACEMENTS = [
  [/[\u2014\u2013\u2012\u2010\u2212]/g, '-'], // em/en/figure dashes, minus
  [/\u2026/g, '...'],
  [/[\u201C\u201D\u00AB\u00BB]/g, '"'],
  [/[\u2018\u2019\u2032]/g, "'"],
  [/[\u00B7\u2022\u2023\u2043]/g, '-'],
  [/[\u2192\u2197\u2196\u21D2]/g, '->'],
  [/\u00D7/g, 'x'],
  [/\u00A0/g, ' '], // nbsp
  [/[\u200B-\u200D\uFEFF]/g, ''], // zero-width
  [/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''], // controls (keep \t \n \r)
];

/**
 * Sanitize a string for newsletter subject/body content.
 */
export function sanitizeNewsletterText(input) {
  let s = String(input ?? '');
  try {
    s = s.normalize('NFKC');
  } catch {
    // ignore
  }

  for (const [re, to] of REPLACEMENTS) {
    s = s.replace(re, to);
  }

  // Drop combining marks after decomposition (e.g. accented Latin -> base + mark)
  try {
    s = s.normalize('NFKD').replace(/\p{M}/gu, '');
  } catch {
    // ignore if Unicode property escapes unavailable
  }

  // Keep printable ASCII + common whitespace only
  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');

  // Tidy whitespace
  s = s
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return s;
}

/**
 * Sanitize digest entry fields in-place (headline/summary/source_name).
 * URLs are left unchanged aside from trimming.
 */
export function sanitizeDigestEntries(byCategory) {
  const out = {};
  for (const [cat, items] of Object.entries(byCategory || {})) {
    out[cat] = (items || []).map((it) => ({
      ...it,
      headline: sanitizeNewsletterText(it.headline),
      summary: sanitizeNewsletterText(it.summary),
      source_name: sanitizeNewsletterText(it.source_name),
      source_url: String(it.source_url || '').trim(),
    }));
  }
  return out;
}

/**
 * Final pass on a built issue (subject/text/html content strings).
 * HTML tags are preserved; only text nodes' weird chars are cleaned via
 * a conservative attribute/text sweep that does not strip markup.
 */
export function sanitizeIssue(issue) {
  return {
    ...issue,
    subject: sanitizeNewsletterText(issue.subject),
    text: sanitizeNewsletterText(issue.text),
    // For HTML: replace known fancy glyphs still present in template/content
    html: sanitizeHtmlDocument(issue.html),
    date: sanitizeNewsletterText(issue.date),
  };
}

function sanitizeHtmlDocument(html) {
  let s = String(html ?? '');
  for (const [re, to] of REPLACEMENTS) {
    s = s.replace(re, to);
  }
  // Remove any remaining non-ASCII outside of HTML entities-safe ASCII
  // but keep the markup intact (tags are ASCII).
  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  return s;
}
