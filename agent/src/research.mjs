/**
 * Gather recent tech developments for the three /dev/digest lanes.
 * Uses public APIs (HN Algolia + arXiv) so scheduled runs don't need an LLM key.
 */

const HN_URL = 'https://hn.algolia.com/api/v1/search';
const ARXIV_URL = 'https://export.arxiv.org/api/query';

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'dev-digest-agent/1.0 (+https://github.com/ark-synbrains/dev-digest)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'dev-digest-agent/1.0 (+https://github.com/ark-synbrains/dev-digest)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n = 320) {
  const t = stripHtml(s);
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + '…';
}

async function searchHn(query, hitsPerPage = 8) {
  const params = new URLSearchParams({
    query,
    tags: 'story',
    hitsPerPage: String(hitsPerPage),
    numericFilters: `created_at_i>${Math.floor(Date.now() / 1000) - 7 * 24 * 3600}`,
  });
  const data = await fetchJson(`${HN_URL}?${params}`);
  return (data.hits || [])
    .filter((h) => h.url && h.title)
    .map((h) => ({
      headline: h.title,
      summary: `Trending on Hacker News (${h.points || 0} points, ${h.num_comments || 0} comments). ${truncate(h.story_text || h.title, 220)}`,
      source_name: 'Hacker News',
      source_url: h.url,
      _score: (h.points || 0) + (h.num_comments || 0) * 0.5,
    }));
}

function parseArxiv(xml) {
  const entries = [];
  const blocks = xml.split('<entry>').slice(1);
  for (const block of blocks) {
    const title = stripHtml((block.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '');
    const summary = stripHtml((block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || '');
    const id = stripHtml((block.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || '');
    if (!title || !id) continue;
    entries.push({
      headline: title.replace(/\s+/g, ' '),
      summary: truncate(summary, 340),
      source_name: 'arXiv',
      source_url: id.replace('http://', 'https://'),
      _score: 1,
    });
  }
  return entries;
}

async function searchArxiv(searchQuery, maxResults = 6) {
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: '0',
    max_results: String(maxResults),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  });
  const xml = await fetchText(`${ARXIV_URL}?${params}`);
  return parseArxiv(xml);
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function pickTop(items, n) {
  return dedupe(items)
    .sort((a, b) => (b._score || 0) - (a._score || 0))
    .slice(0, n)
    .map(({ _score, ...rest }) => rest);
}

export async function researchDigest() {
  const [hnModels, hnProducts, hnAlgo, arxivModels, arxivAlgo] = await Promise.all([
    searchHn('AI model OR LLM OR "open weights" OR GPT OR Claude OR Grok'),
    searchHn('launched OR release OR GA OR "now available" AI OR developer OR API'),
    searchHn('algorithm OR "test-time" OR reasoning OR transformer OR MoE research'),
    searchArxiv('cat:cs.LG OR cat:cs.AI OR cat:cs.CL'),
    searchArxiv('all:"test-time" OR all:"mixture of experts" OR all:reasoning'),
  ]);

  return {
    model: pickTop([...hnModels, ...arxivModels], 3),
    algorithm: pickTop([...arxivAlgo, ...hnAlgo], 3),
    product: pickTop(hnProducts, 3),
  };
}
