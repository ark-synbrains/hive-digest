/**
 * Gather recent tech developments for the three Hive Digest lanes.
 * Uses public APIs (HN Algolia + arXiv, with OpenAlex paper backup) so
 * scheduled runs don't need an LLM key.
 *
 * Resilience (applies to EVERY upstream — HN, arXiv, OpenAlex):
 * - Per-host pacing to avoid burst 429s
 * - Retry transient 429 / 408 / 425 / 5xx (and soft "Rate exceeded." bodies)
 * - Request timeouts so a hung source cannot stall the run
 * - Soft-fail each query so one source never aborts the digest
 * - Lane backups: OpenAlex after arXiv; alternate HN queries for product
 */

const HN_URL = 'https://hn.algolia.com/api/v1/search';
const ARXIV_URL = 'https://export.arxiv.org/api/query';
const OPENALEX_URL = 'https://api.openalex.org/works';

const USER_AGENT = 'hive-digest-agent/1.0 (+https://hive.synbrains.ai/; mailto:news@synbrains.ai)';
const MAX_FETCH_ATTEMPTS = 4;
const FETCH_TIMEOUT_MS = 20_000;

/** Minimum gap between requests to the same host (ms). */
const HOST_MIN_INTERVAL_MS = {
  'export.arxiv.org': 3200, // arXiv API TOU: ≤1 req / 3s
  'api.openalex.org': 250, // polite pool
  'hn.algolia.com': 200, // avoid parallel burst 429s
};

const hostState = new Map(); // host -> { lastAt, queue, consecutiveRateLimits, openCircuit }
const CIRCUIT_TRIP_AFTER = 1; // one exhausted rate-limit cycle trips the host for this run

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function minIntervalFor(url) {
  return HOST_MIN_INTERVAL_MS[hostOf(url)] ?? 100;
}

function getHostState(host) {
  let state = hostState.get(host);
  if (!state) {
    state = { lastAt: 0, queue: Promise.resolve(), consecutiveRateLimits: 0, openCircuit: false };
    hostState.set(host, state);
  }
  return state;
}

function noteRateLimit(url) {
  const state = getHostState(hostOf(url) || 'unknown');
  state.consecutiveRateLimits += 1;
  if (state.consecutiveRateLimits >= CIRCUIT_TRIP_AFTER && !state.openCircuit) {
    state.openCircuit = true;
    console.warn(
      `${hostOf(url)}: circuit open after ${state.consecutiveRateLimits} consecutive rate limits — skipping further calls this run`
    );
  }
}

function noteSuccess(url) {
  const state = getHostState(hostOf(url) || 'unknown');
  state.consecutiveRateLimits = 0;
  state.openCircuit = false;
}

function assertCircuitClosed(url, label) {
  const host = hostOf(url) || 'unknown';
  const state = getHostState(host);
  if (state.openCircuit) {
    throw new Error(`HTTP 429 circuit-open for ${host} (${label})`);
  }
}

/**
 * Serialize + pace requests per host so parallel callers cannot stampede.
 */
async function withHostPace(url, fn) {
  const host = hostOf(url) || 'unknown';
  const state = getHostState(host);

  let release;
  const myTurn = new Promise((resolve) => {
    release = resolve;
  });
  const prev = state.queue;
  // Keep the gate alive even if a prior request threw.
  state.queue = prev.then(
    () => myTurn,
    () => myTurn
  );

  await prev.catch(() => {});
  try {
    const wait = minIntervalFor(url) - (Date.now() - state.lastAt);
    if (state.lastAt && wait > 0) await sleep(wait);
    return await fn();
  } finally {
    state.lastAt = Date.now();
    release();
  }
}

function retryAfterMs(res, attempt) {
  const header = res?.headers?.get?.('retry-after');
  if (header) {
    const asInt = Number(header);
    if (Number.isFinite(asInt) && asInt >= 0) return Math.min(asInt * 1000, 60_000);
    const asDate = Date.parse(header);
    if (Number.isFinite(asDate)) {
      return Math.min(Math.max(asDate - Date.now(), 0), 60_000);
    }
  }
  const base = res?.status === 429 ? 4000 : 1000;
  return Math.min(base * 2 ** (attempt - 1) + Math.floor(Math.random() * 400), 30_000);
}

function isRateExceededBody(text) {
  const head = String(text || '')
    .slice(0, 64)
    .trim()
    .toLowerCase();
  return head.startsWith('rate exceeded') || head.includes('too many requests');
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Fetch with per-host pacing, timeout, and retries for transient failures.
 * @param {string} url
 * @param {{ asJson?: boolean, label?: string }} [opts]
 */
async function fetchWithRetry(url, { asJson = false, label = 'upstream' } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      assertCircuitClosed(url, label);

      const { res, text } = await withHostPace(url, async () => {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        const text = await res.text();
        return { res, text };
      });

      if (res.ok && isRateExceededBody(text)) {
        lastError = new Error(`HTTP 429 (Rate exceeded.) for ${url}`);
        if (attempt < MAX_FETCH_ATTEMPTS) {
          console.warn(
            `${label}: rate limited (soft body) attempt ${attempt}/${MAX_FETCH_ATTEMPTS}; backing off…`
          );
          await sleep(retryAfterMs({ status: 429, headers: res.headers }, attempt));
          continue;
        }
        noteRateLimit(url);
        throw lastError;
      }

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        if (isRetryableStatus(res.status) && attempt < MAX_FETCH_ATTEMPTS) {
          console.warn(
            `${label}: HTTP ${res.status} attempt ${attempt}/${MAX_FETCH_ATTEMPTS}; backing off…`
          );
          await sleep(retryAfterMs(res, attempt));
          continue;
        }
        if (res.status === 429) noteRateLimit(url);
        throw lastError;
      }

      if (asJson) {
        try {
          const parsed = JSON.parse(text);
          noteSuccess(url);
          return parsed;
        } catch (err) {
          lastError = new Error(`Invalid JSON from ${url}: ${err.message}`);
          // Upstream sometimes returns HTML/error pages under load — retry.
          if (attempt < MAX_FETCH_ATTEMPTS) {
            console.warn(
              `${label}: invalid JSON attempt ${attempt}/${MAX_FETCH_ATTEMPTS}; retrying…`
            );
            await sleep(retryAfterMs({ status: 503, headers: res.headers }, attempt));
            continue;
          }
          throw lastError;
        }
      }
      noteSuccess(url);
      return text;
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.startsWith('HTTP ') || err.message.startsWith('Invalid JSON'))
      ) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      const timedOut =
        lastError.name === 'TimeoutError' ||
        lastError.name === 'AbortError' ||
        /aborted|timeout/i.test(lastError.message);
      if (attempt < MAX_FETCH_ATTEMPTS) {
        console.warn(
          `${label}: ${timedOut ? 'timeout' : 'network'} error attempt ${attempt}/${MAX_FETCH_ATTEMPTS}: ${lastError.message}; retrying…`
        );
        await sleep(retryAfterMs(timedOut ? { status: 408 } : null, attempt));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

function decodeHtmlEntities(s) {
  let out = String(s || '');
  for (let i = 0; i < 3; i += 1) {
    const prev = out;
    out = out
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = Number(dec);
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
      });
    if (out === prev) break;
  }
  return out;
}

function stripHtml(s) {
  return decodeHtmlEntities(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n = 320) {
  const t = stripHtml(s);
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + '...';
}

async function settled(label, promise) {
  try {
    return await promise;
  } catch (err) {
    console.warn(`${label} research failed (${err?.message || err}); using empty set.`);
    return [];
  }
}

async function searchHn(query, hitsPerPage = 8) {
  const params = new URLSearchParams({
    query,
    tags: 'story',
    hitsPerPage: String(hitsPerPage),
    numericFilters: `created_at_i>${Math.floor(Date.now() / 1000) - 7 * 24 * 3600}`,
  });
  const data = await fetchWithRetry(`${HN_URL}?${params}`, {
    asJson: true,
    label: `HN[${query}]`,
  });
  return (data.hits || [])
    .filter((h) => h.url && h.title)
    .map((h) => {
      const body = truncate(h.story_text || '', 260);
      const summary = body
        ? body
        : `Community discussion of a notable release or technical update: ${truncate(h.title, 180)}. Engineers are weighing trade-offs, adoption path, and whether it changes production stacks.`;
      return {
        headline: h.title,
        summary,
        source_name: 'Hacker News',
        source_url: h.url,
        _score: (h.points || 0) + (h.num_comments || 0) * 0.5,
      };
    });
}

/**
 * Try HN queries in order until one returns results (or all soft-fail).
 */
async function searchHnWithFallback(queries, label) {
  const collected = [];
  for (const query of queries) {
    const items = await settled(`${label} / HN[${query}]`, searchHn(query));
    if (items.length) {
      if (collected.length === 0 && query !== queries[0]) {
        console.warn(`${label}: primary HN query empty/failed; using backup query "${query}".`);
      }
      collected.push(...items);
      break;
    }
  }
  return collected;
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
  const xml = await fetchWithRetry(`${ARXIV_URL}?${params}`, {
    asJson: false,
    label: 'arXiv',
  });
  return parseArxiv(xml);
}

/**
 * OpenAlex backup when arXiv is unavailable / rate-limited.
 * Scoped to recent AI/ML/NLP concepts so results stay on-lane.
 */
async function searchOpenAlex(searchQuery, maxResults = 6) {
  const nowYear = new Date().getFullYear();
  const fromYear = nowYear - 1;
  // OpenAlex concept ids: Artificial intelligence | Machine learning | NLP
  const params = new URLSearchParams({
    search: searchQuery,
    filter: [
      `from_publication_date:${fromYear}-01-01`,
      'type:article',
      'concepts.id:C154945302|C119857082|C204321447',
    ].join(','),
    sort: 'publication_date:desc',
    per_page: String(maxResults),
  });
  const data = await fetchWithRetry(`${OPENALEX_URL}?${params}`, {
    asJson: true,
    label: 'OpenAlex',
  });
  return (data.results || [])
    .map((work) => {
      const year = Number(work.publication_year);
      if (Number.isFinite(year) && year > nowYear + 1) return null;
      const title = stripHtml(work.title || '');
      const landing =
        work.primary_location?.landing_page_url ||
        (work.doi ? `https://doi.org/${String(work.doi).replace(/^https?:\/\/doi\.org\//i, '')}` : '') ||
        work.id ||
        '';
      if (!title || !landing) return null;
      const summary = truncate(reconstructAbstract(work.abstract_inverted_index) || title, 340);
      return {
        headline: title.replace(/\s+/g, ' '),
        summary,
        source_name: 'OpenAlex',
        source_url: landing,
        _score: 1,
      };
    })
    .filter(Boolean);
}

function reconstructAbstract(inverted) {
  if (!inverted || typeof inverted !== 'object') return '';
  const positions = [];
  for (const [word, idxs] of Object.entries(inverted)) {
    for (const i of idxs || []) positions.push([i, word]);
  }
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(([, w]) => w).join(' ');
}

/**
 * Prefer arXiv; on exhaustion fall back to OpenAlex; on total failure return [].
 */
async function searchPapers({ arxivQuery, openAlexQuery, label }) {
  try {
    const items = await searchArxiv(arxivQuery);
    if (items.length) return items;
    console.warn(`arXiv returned 0 results for ${label}; trying OpenAlex backup…`);
  } catch (err) {
    console.warn(
      `arXiv failed for ${label} (${err?.message || err}); trying OpenAlex backup…`
    );
  }

  try {
    const backup = await searchOpenAlex(openAlexQuery);
    if (backup.length) {
      console.warn(`Using OpenAlex backup for ${label} (${backup.length} items).`);
      return backup;
    }
    console.warn(`OpenAlex backup returned 0 results for ${label}.`);
  } catch (err) {
    console.warn(`OpenAlex backup failed for ${label} (${err?.message || err}).`);
  }

  console.warn(`Continuing without paper sources for ${label} (HN-only fallback).`);
  return [];
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
  // Keep a wider pool; validate.mjs applies insight scoring & final ranking.
  return dedupe(items)
    .sort((a, b) => (b._score || 0) - (a._score || 0))
    .slice(0, n)
    .map(({ _score, ...rest }) => ({
      ...rest,
      _popularity: typeof _score === 'number' ? _score : 0,
    }));
}

export async function researchDigest() {
  // Per-host pacing serializes bursts; Promise.all still overlaps different hosts.
  const [hnModels, hnProducts, hnAlgo] = await Promise.all([
    searchHnWithFallback(['LLM', 'language model', 'GPT'], 'models lane'),
    searchHnWithFallback(['Show HN', 'launch', 'product launch'], 'product lane'),
    searchHnWithFallback(['open source', 'opensource', 'self-hosted'], 'algorithms lane'),
  ]);

  const paperModels = await searchPapers({
    label: 'models & research',
    arxivQuery: 'cat:cs.LG OR cat:cs.AI OR cat:cs.CL',
    openAlexQuery: 'large language model OR foundation model machine learning',
  });

  const paperAlgo = await searchPapers({
    label: 'algorithms & systems',
    arxivQuery: 'all:"test-time" OR all:"mixture of experts" OR all:reasoning',
    openAlexQuery: 'test-time compute OR mixture of experts OR LLM reasoning systems',
  });

  const model = pickTop([...hnModels, ...paperModels], 8);
  const algorithm = pickTop([...paperAlgo, ...hnAlgo], 8);
  const product = pickTop(hnProducts, 8);

  if (!model.length && !algorithm.length && !product.length) {
    throw new Error(
      'All research sources returned empty after retries/fallbacks (HN, arXiv, OpenAlex)'
    );
  }

  return { model, algorithm, product };
}

// Test helpers (not used by the agent CLI).
export const __test = {
  isRateExceededBody,
  isRetryableStatus,
  retryAfterMs,
  reconstructAbstract,
  parseArxiv,
  truncate,
  minIntervalFor,
  HOST_MIN_INTERVAL_MS,
};
