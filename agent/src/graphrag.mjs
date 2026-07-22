/**
 * Content GraphRAG for Hive Digest.
 *
 * Builds a Graphify-compatible knowledge graph from research candidates
 * (entries + shared technical concepts), then attaches ranking boosts.
 *
 * Separates content graph artifacts under agent/out/digest-graph/ so the
 * repo codebase graph (graphify-out/) stays untouched.
 *
 * Env:
 *   HIVE_GRAPHRAG=0     disable (default: enabled)
 *   HIVE_GRAPHRAG_FORCE_NODE=1  skip Python/graphify; use Node fallback only
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSIGHT_TERMS } from './validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = join(__dirname, '..');
const SCRIPT_PATH = join(AGENT_ROOT, 'scripts', 'build_content_graph.py');

const EXTRA_CONCEPTS = [
  'llm',
  'foundation model',
  'language model',
  'gpt',
  'claude',
  'gemini',
  'llama',
  'mistral',
  'deepseek',
  'cuda',
  'kernel',
  'attention',
  'memory',
  'context',
  'agent',
  'rag',
  'eval',
  'benchmark',
  'open-source',
  'github',
  'arxiv',
  'sso',
  'enterprise',
];

function enabled() {
  const v = String(process.env.HIVE_GRAPHRAG || '1').trim().toLowerCase();
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no');
}

function forceNodeOnly() {
  const v = String(process.env.HIVE_GRAPHRAG_FORCE_NODE || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || 'item';
}

function conceptId(term) {
  return `concept_${slugify(term)}`;
}

function entryId(category, index, headline) {
  return `entry_${slugify(category)}_${index}_${slugify(headline)}`;
}

function extractConcepts(item) {
  const blob = `${item.headline || ''} ${item.summary || ''}`.toLowerCase();
  const hits = new Set();
  for (const term of [...INSIGHT_TERMS, ...EXTRA_CONCEPTS]) {
    const t = String(term).toLowerCase().trim();
    if (t && blob.includes(t)) hits.add(t.trim());
  }
  // Model-ish tokens
  const modelHits = blob.match(
    /\b(gpt|claude|gemini|llama|mistral|grok|qwen|deepseek|o\d)\b/gi
  );
  for (const m of modelHits || []) hits.add(m.toLowerCase());
  return [...hits];
}

/**
 * Build a Graphify extraction dict from digest lanes.
 * @returns {{ extraction: object, idMap: Map<string, {category: string, index: number}>, conceptIndex: Map<string, string[]> }}
 */
export function buildExtraction(byCategory) {
  const nodes = [];
  const edges = [];
  const idMap = new Map();
  const conceptOwners = new Map(); // conceptId -> entryIds
  const seenNodes = new Set();

  function addNode(node) {
    if (seenNodes.has(node.id)) return;
    seenNodes.add(node.id);
    nodes.push(node);
  }

  for (const [category, items] of Object.entries(byCategory || {})) {
    (items || []).forEach((item, index) => {
      const eid = entryId(category, index, item.headline);
      idMap.set(eid, { category, index, headline: item.headline });
      const sourceFile = `corpus/${slugify(category)}/${slugify(item.headline) || index}.md`;
      addNode({
        id: eid,
        label: String(item.headline || eid).slice(0, 120),
        file_type: 'document',
        source_file: sourceFile,
        source_location: null,
        _origin: 'digest_graphrag',
        category,
      });

      // Lane concept
      const laneId = conceptId(`lane_${category}`);
      addNode({
        id: laneId,
        label: `lane:${category}`,
        file_type: 'concept',
        source_file: sourceFile,
        _origin: 'digest_graphrag',
      });
      edges.push({
        source: eid,
        target: laneId,
        relation: 'belongs_to',
        confidence: 'EXTRACTED',
        confidence_score: 1.0,
        source_file: sourceFile,
        _origin: 'digest_graphrag',
      });

      // Source host concept
      let host = '';
      try {
        host = new URL(item.source_url).hostname.toLowerCase();
      } catch {
        host = '';
      }
      if (host) {
        const hid = conceptId(`host_${host}`);
        addNode({
          id: hid,
          label: host,
          file_type: 'concept',
          source_file: sourceFile,
          _origin: 'digest_graphrag',
        });
        edges.push({
          source: eid,
          target: hid,
          relation: 'sourced_from',
          confidence: 'EXTRACTED',
          confidence_score: 1.0,
          source_file: sourceFile,
          _origin: 'digest_graphrag',
        });
      }

      for (const term of extractConcepts(item)) {
        const cid = conceptId(term);
        addNode({
          id: cid,
          label: term,
          file_type: 'concept',
          source_file: sourceFile,
          _origin: 'digest_graphrag',
        });
        edges.push({
          source: eid,
          target: cid,
          relation: 'mentions',
          confidence: 'EXTRACTED',
          confidence_score: 1.0,
          source_file: sourceFile,
          _origin: 'digest_graphrag',
        });
        if (!conceptOwners.has(cid)) conceptOwners.set(cid, []);
        conceptOwners.get(cid).push(eid);
      }
    });
  }

  // Link entries that share a concept (co-mention bridges)
  for (const [, owners] of conceptOwners) {
    if (owners.length < 2) continue;
    for (let i = 0; i < owners.length; i++) {
      for (let j = i + 1; j < owners.length; j++) {
        edges.push({
          source: owners[i],
          target: owners[j],
          relation: 'conceptually_related_to',
          confidence: 'INFERRED',
          confidence_score: 0.6,
          source_file: 'corpus/_bridges.md',
          _origin: 'digest_graphrag',
        });
      }
    }
  }

  return {
    extraction: {
      nodes,
      edges,
      hyperedges: [],
      input_tokens: 0,
      output_tokens: 0,
    },
    idMap,
  };
}

/** Pure-Node fallback boosts when graphify Python is unavailable. */
export function computeNodeFallbackBoosts(extraction, idMap) {
  const degree = new Map();
  for (const e of extraction.edges) {
    degree.set(e.source, (degree.get(e.source) || 0) + 1);
    degree.set(e.target, (degree.get(e.target) || 0) + 1);
  }

  // Concept hubs = highest-degree concepts
  const conceptDegrees = extraction.nodes
    .filter((n) => n.file_type === 'concept')
    .map((n) => ({ id: n.id, label: n.label, degree: degree.get(n.id) || 0 }))
    .sort((a, b) => b.degree - a.degree);
  const hubIds = new Set(conceptDegrees.slice(0, 8).map((c) => c.id));

  const neighbors = new Map();
  for (const e of extraction.edges) {
    if (!neighbors.has(e.source)) neighbors.set(e.source, new Set());
    if (!neighbors.has(e.target)) neighbors.set(e.target, new Set());
    neighbors.get(e.source).add(e.target);
    neighbors.get(e.target).add(e.source);
  }

  const boosts = {};
  for (const [eid] of idMap) {
    const nbrs = [...(neighbors.get(eid) || [])];
    const hubHits = nbrs.filter((n) => hubIds.has(n));
    const entryNbrs = nbrs.filter((n) => idMap.has(n));
    let boost = 0;
    const reasons = [];
    if (hubHits.length) {
      boost += Math.min(7, 2 + hubHits.length * 1.5);
      reasons.push(`linked to ${hubHits.length} concept hub(s)`);
    }
    if (entryNbrs.length) {
      boost += Math.min(4, entryNbrs.length * 1.5);
      reasons.push(`bridges ${entryNbrs.length} related item(s)`);
    }
    boost = Math.round(Math.max(0, Math.min(12, boost)));
    if (boost > 0) {
      boosts[eid] = { boost, reasons, degree: degree.get(eid) || 0 };
    }
  }
  return boosts;
}

function writeCorpus(byCategory, outDir) {
  const corpusDir = join(outDir, 'corpus');
  mkdirSync(corpusDir, { recursive: true });
  for (const [category, items] of Object.entries(byCategory || {})) {
    const catDir = join(corpusDir, slugify(category));
    mkdirSync(catDir, { recursive: true });
    (items || []).forEach((item, index) => {
      const name = `${String(index).padStart(2, '0')}-${slugify(item.headline) || 'item'}.md`;
      const body = [
        `# ${item.headline || 'Untitled'}`,
        '',
        `- Category: ${category}`,
        `- Source: ${item.source_name || ''} (${item.source_url || ''})`,
        '',
        item.summary || '',
        '',
      ].join('\n');
      writeFileSync(join(catDir, name), body, 'utf8');
    });
  }
}

function resolvePython() {
  const candidates = [
    process.env.GRAPHIFY_PYTHON,
    join(AGENT_ROOT, '..', 'graphify-out', '.graphify_python'),
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (c.endsWith('.graphify_python') && existsSync(c)) {
      const p = readFileSync(c, 'utf8').trim();
      if (p) return p;
    }
    if (existsSync(c)) return c;
  }
  return 'python3';
}

function runGraphifyBuild(extractionPath, outDir) {
  const python = resolvePython();
  const result = spawnSync(
    python,
    [SCRIPT_PATH, '--extraction', extractionPath, '--out-dir', outDir, '--root', outDir],
    { encoding: 'utf8', timeout: 60_000 }
  );
  if (result.error) {
    return { ok: false, error: String(result.error.message || result.error) };
  }
  if (result.status !== 0) {
    let parsed;
    try {
      parsed = JSON.parse((result.stdout || '').trim() || '{}');
    } catch {
      parsed = {};
    }
    return {
      ok: false,
      error: parsed.error || result.stderr || `exit ${result.status}`,
      stderr: result.stderr,
    };
  }
  try {
    return JSON.parse((result.stdout || '').trim());
  } catch {
    return { ok: false, error: 'invalid JSON from build_content_graph.py' };
  }
}

/**
 * Enrich research lanes with GraphRAG ranking boosts (`_graphBoost`).
 * Soft-fails to Node fallback (or no-op when disabled).
 */
export async function enrichDigestWithGraphRag(byCategory, options = {}) {
  if (!enabled()) {
    return {
      byCategory,
      graphRag: { enabled: false, engine: 'off', boosted: 0 },
    };
  }

  const stamp = options.stamp || new Date().toISOString().slice(0, 10);
  const outDir = options.outDir || join(AGENT_ROOT, 'out', 'digest-graph', stamp);
  mkdirSync(outDir, { recursive: true });

  const { extraction, idMap } = buildExtraction(byCategory);
  writeCorpus(byCategory, outDir);

  const extractionPath = join(outDir, 'extraction.json');
  writeFileSync(extractionPath, JSON.stringify(extraction, null, 2) + '\n', 'utf8');

  let boosts = {};
  let engine = 'node-fallback';
  let meta = {};

  if (!forceNodeOnly() && existsSync(SCRIPT_PATH)) {
    const built = runGraphifyBuild(extractionPath, outDir);
    if (built.ok) {
      engine = 'graphify';
      meta = built;
      try {
        boosts = JSON.parse(readFileSync(join(outDir, 'boosts.json'), 'utf8'));
      } catch {
        boosts = {};
      }
    } else {
      meta = { fallbackReason: built.error };
      boosts = computeNodeFallbackBoosts(extraction, idMap);
      writeFileSync(join(outDir, 'boosts.json'), JSON.stringify(boosts, null, 2) + '\n');
    }
  } else {
    meta = { fallbackReason: forceNodeOnly() ? 'HIVE_GRAPHRAG_FORCE_NODE' : 'missing script' };
    boosts = computeNodeFallbackBoosts(extraction, idMap);
    writeFileSync(join(outDir, 'boosts.json'), JSON.stringify(boosts, null, 2) + '\n');
  }

  // Attach boosts onto items (ranking-only; stripped before email)
  const enriched = {};
  let boosted = 0;
  for (const [category, items] of Object.entries(byCategory || {})) {
    enriched[category] = (items || []).map((item, index) => {
      const eid = entryId(category, index, item.headline);
      const hit = boosts[eid];
      if (!hit || !hit.boost) return { ...item };
      boosted += 1;
      return {
        ...item,
        _graphBoost: hit.boost,
        _graphReasons: hit.reasons || [],
      };
    });
  }

  const summary = {
    enabled: true,
    engine,
    boosted,
    outDir,
    nodes: extraction.nodes.length,
    edges: extraction.edges.length,
    ...meta,
  };
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

  return { byCategory: enriched, graphRag: summary };
}
