/**
 * Validate Hive Digest entries and rank them by insight value.
 *
 * Scores are ranking-only — never rendered in emailed or exported issues.
 * Mirrored client-side in hive-digest.html (scoreInsight / validateItem).
 */

const REQUIRED = ['headline', 'summary', 'source_name', 'source_url'];

const PRIMARY_HOST_HINTS = [
  'arxiv.org',
  'github.com',
  'openai.com',
  'anthropic.com',
  'deepmind.com',
  'ai.google',
  'research.google',
  'microsoft.com',
  'meta.com',
  'nvidia.com',
  'huggingface.co',
  'blog.',
  'docs.',
];

export const INSIGHT_TERMS = [
  'benchmark',
  'latency',
  'throughput',
  'accuracy',
  'eval',
  'weights',
  'open-source',
  'open source',
  'architecture',
  'transformer',
  'diffusion',
  'reasoning',
  'inference',
  'training',
  'dataset',
  'api',
  'sdk',
  'release',
  'ga ',
  'preview',
  'paper',
  'sota',
  'ablation',
  'scaling',
  'moe',
  'quantization',
  'fine-tune',
  'finetune',
  'rag',
  'agent',
];

const BOILERPLATE = [
  'trending on hacker news',
  'points, ',
  'comments).',
];

function isHttpUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function wordCount(s) {
  return String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Schema + content validation for a single entry.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateItem(item) {
  const errors = [];
  if (!item || typeof item !== 'object') {
    return { ok: false, errors: ['item is not an object'] };
  }

  for (const key of REQUIRED) {
    if (!item[key] || !String(item[key]).trim()) {
      errors.push(`missing ${key}`);
    }
  }

  if (item.headline && String(item.headline).trim().length < 8) {
    errors.push('headline too short');
  }
  if (item.summary && wordCount(item.summary) < 12) {
    errors.push('summary too thin for insight ranking');
  }
  if (item.source_url && !isHttpUrl(item.source_url)) {
    errors.push('source_url is not a valid http(s) URL');
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Score how much an entry improves engineer understanding (0–100).
 * Higher = show earlier. Never display this in the emailed or exported issue.
 */
export function scoreInsight(item) {
  const { ok } = validateItem(item);
  if (!ok) return 0;

  const headline = String(item.headline || '');
  const summary = String(item.summary || '');
  const blob = `${headline} ${summary}`.toLowerCase();
  const host = (() => {
    try {
      return new URL(item.source_url).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();

  let score = 28; // valid baseline

  // Summary depth / readability for understanding
  const words = wordCount(summary);
  score += clamp((words - 12) * 0.9, 0, 22);

  // Specificity: versions, percentages, model-ish tokens
  if (/\b(v?\d+\.\d+|\d+%|\b\d{3,}\b)/.test(blob)) score += 8;
  if (/\b(gpt|claude|gemini|llama|mistral|grok|qwen|deepseek|o\d)\b/i.test(blob)) {
    score += 8;
  }
  if (/\b(paper|arxiv|benchmark|eval|sota)\b/i.test(blob)) score += 6;

  // Technical insight density
  let termHits = 0;
  for (const t of INSIGHT_TERMS) {
    if (blob.includes(t)) termHits += 1;
  }
  score += clamp(termHits * 2.5, 0, 18);

  // Primary / authoritative sources
  if (PRIMARY_HOST_HINTS.some((h) => host.includes(h))) score += 12;
  else if (host.endsWith('.edu') || host.endsWith('.org')) score += 8;
  else score += 3;

  // Penalties for low-insight boilerplate
  for (const b of BOILERPLATE) {
    if (blob.includes(b)) score -= 10;
  }
  if (summary.trim() === headline.trim()) score -= 15;
  if (words < 20) score -= 6;

  // Mild popularity prior if research attached one (does not dominate)
  if (typeof item._popularity === 'number' && item._popularity > 0) {
    score += clamp(Math.log10(1 + item._popularity) * 3, 0, 8);
  }

  // Content GraphRAG boost (from agent/src/graphrag.mjs) — capped, ranking-only
  if (typeof item._graphBoost === 'number' && item._graphBoost > 0) {
    score += clamp(item._graphBoost, 0, 12);
  }

  return Math.round(clamp(score, 0, 100));
}

function stripRankingFields(item) {
  const {
    insightScore: _insightScore,
    _popularity: _pop,
    _score: _legacy,
    _errors: _errors,
    _graphBoost: _graphBoost,
    _graphReasons: _graphReasons,
    ...rest
  } = item;
  return rest;
}

/**
 * Validate, score, and rank digest lanes.
 * Returns public entries (no scores) plus a ranking report for logs.
 */
export function validateAndRankDigest(byCategory, { minScore = 35, perCategory = 3 } = {}) {
  const report = { kept: 0, dropped: 0, categories: {} };
  const ranked = {};

  const categoryScores = [];

  for (const [cat, items] of Object.entries(byCategory || {})) {
    const scored = [];
    for (const raw of items || []) {
      const check = validateItem(raw);
      if (!check.ok) {
        report.dropped += 1;
        continue;
      }
      const insightScore = scoreInsight(raw);
      if (insightScore < minScore) {
        report.dropped += 1;
        continue;
      }
      scored.push({ ...raw, insightScore });
    }

    scored.sort((a, b) => b.insightScore - a.insightScore || a.headline.localeCompare(b.headline));
    const top = scored.slice(0, perCategory);
    ranked[cat] = top.map(stripRankingFields);
    report.kept += top.length;
    const avg =
      top.length === 0 ? 0 : top.reduce((s, it) => s + it.insightScore, 0) / top.length;
    report.categories[cat] = {
      count: top.length,
      avgInsightScore: Math.round(avg * 10) / 10,
      order: top.map((it) => ({
        headline: it.headline,
        insightScore: it.insightScore,
      })),
    };
    categoryScores.push({ cat, avg });
  }

  // Section order: highest average insight first, lowest last
  const sectionOrder = categoryScores
    .filter((c) => (ranked[c.cat] || []).length > 0)
    .sort((a, b) => b.avg - a.avg)
    .map((c) => c.cat);

  report.sectionOrder = sectionOrder;

  return { byCategory: ranked, sectionOrder, report };
}
