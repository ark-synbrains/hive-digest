/**
 * Server-side port of the /dev/digest generation logic from tech-digest-agent.html.
 * Calls Anthropic Messages API with web_search and returns structured issue data.
 */

const SECTION_META = {
  model: { label: 'models & research' },
  algorithm: { label: 'algorithms & systems' },
  product: { label: 'product & company releases' },
};

const SCOPE_TO_CATEGORIES = {
  all: ['model', 'algorithm', 'product'],
  models: ['model'],
  products: ['product'],
  algorithms: ['algorithm'],
};

function categoryPrompt(cat, today) {
  const focus = {
    model:
      'new or meaningfully upgraded AI/ML models (LLMs, image/audio/video models, or notable research models) and the papers or techniques behind them',
    algorithm:
      'new algorithms, systems techniques, infrastructure breakthroughs, or technical methods — not consumer product news',
    product:
      'company product launches, major feature releases, and hardware/software announcements ("Company X released Product Y")',
  }[cat];

  return `You are a technical news editor for hands-on engineers and researchers.
Today's date is ${today}.
Use web search to find 3 to 4 distinct, recent (last 7-10 days, or most recent available) global developments about: ${focus}.
Skip rumors and opinion pieces; prefer primary announcements (company blogs, official docs, papers, reputable tech press). Do 2-3 targeted searches at most, then stop searching and answer.

Respond with ONLY a raw JSON array (no markdown fences, no prose before or after). Each element must have exactly these fields:
- "headline": short punchy headline, under 12 words, no trailing period
- "summary": 2-3 sentences, technical and specific (mention concrete numbers/specs/benchmarks where available), written in your own words, no quotations
- "source_name": the publication or company blog name
- "source_url": the direct URL

Return nothing but the JSON array.`;
}

function parseItems(textBlocks, cat) {
  if (!textBlocks.trim()) {
    throw new Error('empty response body');
  }

  let cleaned = textBlocks
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }

  let items;
  try {
    items = JSON.parse(cleaned);
  } catch {
    throw new Error('could not parse JSON: ' + cleaned.slice(0, 120));
  }
  if (!Array.isArray(items)) {
    throw new Error(cat + ' returned malformed data (not an array)');
  }
  return items;
}

async function fetchCategory({ cat, today, apiKey, model, attempt = 1 }) {
  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: categoryPrompt(cat, today),
        messages: [{ role: 'user', content: 'Generate these entries now.' }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });
  } catch (networkErr) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 800));
      return fetchCategory({ cat, today, apiKey, model, attempt: attempt + 1 });
    }
    throw new Error(
      (networkErr.name || 'NetworkError') +
        ': ' +
        (networkErr.message || 'request could not be sent')
    );
  }

  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = (await response.text()).slice(0, 200);
    } catch {
      /* ignore */
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000));
      return fetchCategory({ cat, today, apiKey, model, attempt: attempt + 1 });
    }
    throw new Error(
      'HTTP ' + response.status + (bodyText ? ' — ' + bodyText : '')
    );
  }

  const data = await response.json();
  const textBlocks = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return parseItems(textBlocks, cat);
}

/**
 * Generate a full newsletter issue.
 * @returns {Promise<{ number: number, date: string, isoDate: string, byCategory: Record<string, any[]>, errors: Record<string, string> }>}
 */
export async function generateIssue({ apiKey, model, scope = 'all', issueNumber }) {
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 10);
  const date = now.toDateString();
  const number =
    typeof issueNumber === 'number' && issueNumber > 0
      ? issueNumber
      : Number(isoDate.replace(/-/g, ''));

  const categories = SCOPE_TO_CATEGORIES[scope] || SCOPE_TO_CATEGORIES.all;
  const byCategory = {};
  const errors = {};

  const results = await Promise.allSettled(
    categories.map((cat, idx) =>
      new Promise((resolve) => setTimeout(resolve, idx * 350)).then(() =>
        fetchCategory({ cat, today: isoDate, apiKey, model })
      )
    )
  );

  results.forEach((result, idx) => {
    const cat = categories[idx];
    if (result.status === 'fulfilled') {
      byCategory[cat] = result.value;
    } else {
      errors[cat] = result.reason?.message || 'unknown error';
    }
  });

  if (Object.keys(byCategory).length === 0) {
    const firstErr = Object.values(errors)[0] || 'unknown error';
    throw new Error('all lanes failed — ' + firstErr);
  }

  return { number, date, isoDate, byCategory, errors, sectionMeta: SECTION_META };
}

export { SECTION_META };
