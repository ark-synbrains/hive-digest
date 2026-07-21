import assert from 'node:assert/strict';
import { __test } from './research.mjs';

const {
  isRateExceededBody,
  isRetryableStatus,
  retryAfterMs,
  reconstructAbstract,
  parseArxiv,
  truncate,
  minIntervalFor,
  HOST_MIN_INTERVAL_MS,
} = __test;

assert.equal(isRateExceededBody('Rate exceeded.'), true);
assert.equal(isRateExceededBody('rate exceeded'), true);
assert.equal(isRateExceededBody('Too Many Requests'), true);
assert.equal(isRateExceededBody('<?xml version="1.0"?>'), false);

assert.equal(isRetryableStatus(429), true);
assert.equal(isRetryableStatus(503), true);
assert.equal(isRetryableStatus(408), true);
assert.equal(isRetryableStatus(425), true);
assert.equal(isRetryableStatus(404), false);
assert.equal(isRetryableStatus(400), false);

const headers = { get: (k) => (k === 'retry-after' ? '2' : null) };
assert.equal(retryAfterMs({ status: 429, headers }, 1), 2000);

assert.equal(minIntervalFor('https://export.arxiv.org/api/query'), HOST_MIN_INTERVAL_MS['export.arxiv.org']);
assert.equal(minIntervalFor('https://hn.algolia.com/api/v1/search'), HOST_MIN_INTERVAL_MS['hn.algolia.com']);
assert.equal(minIntervalFor('https://api.openalex.org/works'), HOST_MIN_INTERVAL_MS['api.openalex.org']);

const abs = reconstructAbstract({ Hello: [0], world: [1] });
assert.equal(abs, 'Hello world');

const xml = `
<feed>
  <entry>
    <title>Test Paper</title>
    <summary>A short abstract about transformers.</summary>
    <id>http://arxiv.org/abs/1234.5678</id>
  </entry>
</feed>`;
const parsed = parseArxiv(xml);
assert.equal(parsed.length, 1);
assert.equal(parsed[0].source_name, 'arXiv');
assert.equal(parsed[0].source_url, 'https://arxiv.org/abs/1234.5678');
assert.equal(parsed[0].headline, 'Test Paper');

assert.ok(truncate('x'.repeat(400), 50).endsWith('...'));
assert.equal(truncate('short', 50), 'short');

console.log('research.test.mjs: ok');
