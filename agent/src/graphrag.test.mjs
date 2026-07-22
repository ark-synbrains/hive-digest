/**
 * Tests for content GraphRAG (Graphify-backed ranking boosts).
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildExtraction,
  computeNodeFallbackBoosts,
  enrichDigestWithGraphRag,
} from './graphrag.mjs';
import { scoreInsight, validateAndRankDigest } from './validate.mjs';

const sample = {
  model: [
    {
      headline: 'OpenAI releases GPT benchmark suite for agent evals',
      summary:
        'New open benchmark measures tool-use accuracy and latency on multi-step coding agents. Engineers can reproduce results from the published leaderboard.',
      source_name: 'OpenAI',
      source_url: 'https://openai.com/index/benchmark',
    },
    {
      headline: 'Claude agents hit new latency benchmark on tool use',
      summary:
        'Anthropic publishes agent eval numbers showing lower latency and higher accuracy on coding tool-use tasks versus prior Claude releases.',
      source_name: 'Anthropic',
      source_url: 'https://www.anthropic.com/research/agent-evals',
    },
  ],
  algorithm: [
    {
      headline: 'FlashAttention-4 cuts memory on long-context transformers',
      summary:
        'Paper shows a tiling algorithm that reduces HBM traffic for 128k context with open-source CUDA kernels on GitHub for transformer inference.',
      source_name: 'arXiv',
      source_url: 'https://arxiv.org/abs/2401.12345',
    },
  ],
  product: [
    {
      headline: 'Anthropic launches Claude Code enterprise controls',
      summary:
        'Product release adds SSO, audit logs, and repo allowlists for team coding agents in Claude.ai.',
      source_name: 'Anthropic',
      source_url: 'https://www.anthropic.com/news/claude-code',
    },
  ],
};

const { extraction, idMap } = buildExtraction(sample);
assert.ok(extraction.nodes.length >= 8, 'expected entry + concept nodes');
assert.ok(extraction.edges.length >= 8, 'expected mentions / lane edges');
assert.ok(idMap.size === 4, 'expected 4 entry ids');

const fallback = computeNodeFallbackBoosts(extraction, idMap);
assert.ok(Object.keys(fallback).length >= 1, 'shared concepts should boost some entries');

// Graph boost must raise scoreInsight without leaking into public output
const baseItem = sample.model[0];
const baseScore = scoreInsight(baseItem);
const boostedScore = scoreInsight({ ...baseItem, _graphBoost: 8 });
assert.ok(boostedScore > baseScore, 'graph boost should increase insight score');
assert.ok(boostedScore - baseScore <= 12, 'graph boost should be capped');

const tmp = mkdtempSync(join(tmpdir(), 'hive-graphrag-'));
process.env.HIVE_GRAPHRAG = '1';
process.env.HIVE_GRAPHRAG_FORCE_NODE = '1';

const { byCategory, graphRag } = await enrichDigestWithGraphRag(sample, {
  outDir: tmp,
  stamp: 'test',
});
assert.equal(graphRag.enabled, true);
assert.equal(graphRag.engine, 'node-fallback');
assert.ok(existsSync(join(tmp, 'extraction.json')));
assert.ok(existsSync(join(tmp, 'boosts.json')));
assert.ok(existsSync(join(tmp, 'corpus')));

const { byCategory: ranked, report } = validateAndRankDigest(byCategory);
assert.ok(report.kept >= 1);
const serialized = JSON.stringify(ranked);
assert.doesNotMatch(serialized, /_graphBoost|_graphReasons|insightScore/);

// Disabled path is a no-op
process.env.HIVE_GRAPHRAG = '0';
const off = await enrichDigestWithGraphRag(sample, { outDir: join(tmp, 'off') });
assert.equal(off.graphRag.enabled, false);

rmSync(tmp, { recursive: true, force: true });
delete process.env.HIVE_GRAPHRAG_FORCE_NODE;
delete process.env.HIVE_GRAPHRAG;

console.log('graphrag.test.mjs: ok');
