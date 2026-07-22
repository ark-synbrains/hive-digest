#!/usr/bin/env node
/**
 * Hive Digest monthly sender (Node CLI for ark-synbrains/hive-digest).
 *
 * Flow: researchDigest → enrichDigestWithGraphRag → validateAndRankDigest
 *       → buildIssue → sanitizeIssue → archive digests/ → SMTP (unless --dry-run).
 * Browser UI counterpart: ../hive-digest.html (Claude.ai artifact).
 * npm package name: hive-digest-agent (this directory is agent/).
 *
 * Required env: SMTP_* and NEWSLETTER_TO_EMAILS
 * (historical recipient-list name — product is still Hive Digest).
 * Optional: HIVE_GRAPHRAG=0 to disable content GraphRAG ranking boosts.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { researchDigest } from './research.mjs';
import { enrichDigestWithGraphRag } from './graphrag.mjs';
import { validateAndRankDigest } from './validate.mjs';
import { buildIssue } from './render.mjs';
import { sanitizeIssue } from './sanitize.mjs';
import { sendSmtpEmail } from './smtp.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
/** Repo root (parent of agent/) — tracked issue archive lives here. */
const REPO_ROOT = join(ROOT, '..');
const STATE_PATH = join(ROOT, 'state.json');
const DIGESTS_DIR = join(REPO_ROOT, 'digests');

function loadState() {
  if (!existsSync(STATE_PATH)) {
    return { runsCompleted: 0, lastSentAt: null, history: [] };
  }
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing required env: ${name}`);
  return v.trim();
}

function parseRecipients(raw) {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Display / subject date: DD Mon YYYY (e.g. 20 Jul 2026). */
function formatDate(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function dateStamp(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function hourStamp(d = new Date()) {
  return d.toISOString().slice(0, 13).replace('T', '-');
}

/**
 * Persist every generated issue into the repo archive (digests/) and matching
 * tracked artifacts under agent/out/. Both dry-run and live sends call this.
 *
 * Layout:
 *   digests/YYYY-MM-DD/
 *     hive-digest.html
 *     hive-digest.txt
 *     ranking.json
 *     graphrag.json
 *     meta.json
 *   agent/out/
 *     digest-YYYY-MM-DD.{html,txt,ranking.json,graphrag.json}
 *     digest-graph/YYYY-MM-DD/…
 */
function archiveIssue({
  stamp,
  date,
  issue,
  report,
  graphRag,
  sectionOrder,
  entries,
  dryRun,
  messageId = null,
  recipients = null,
}) {
  const meta = {
    subject: issue.subject,
    date,
    dateStamp: stamp,
    dryRun: Boolean(dryRun),
    entries,
    sectionOrder,
    messageId,
    recipients,
    archivedAt: new Date().toISOString(),
    rankingKept: report?.kept ?? null,
    rankingDropped: report?.dropped ?? null,
    graphRag: graphRag
      ? {
          enabled: graphRag.enabled,
          engine: graphRag.engine,
          boosted: graphRag.boosted,
          nodes: graphRag.nodes,
          edges: graphRag.edges,
        }
      : null,
  };

  const repoDir = join(DIGESTS_DIR, stamp);
  mkdirSync(repoDir, { recursive: true });
  writeFileSync(join(repoDir, 'hive-digest.html'), issue.html);
  writeFileSync(join(repoDir, 'hive-digest.txt'), issue.text);
  writeFileSync(join(repoDir, 'ranking.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(repoDir, 'graphrag.json'), JSON.stringify(graphRag, null, 2) + '\n');
  writeFileSync(join(repoDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

  // Tracked run artifacts (committed with digests/ by CI / automation)
  const outDir = join(ROOT, 'out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `digest-${stamp}.html`), issue.html);
  writeFileSync(join(outDir, `digest-${stamp}.txt`), issue.text);
  writeFileSync(join(outDir, `digest-${stamp}.ranking.json`), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(outDir, `digest-${stamp}.graphrag.json`), JSON.stringify(graphRag, null, 2) + '\n');

  return { repoDir, outDir, meta };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const state = loadState();
  const now = new Date();
  const date = formatDate(now);
  const stamp = dateStamp(now);

  console.log('Researching Hive Digest lanes...');
  const researched = await researchDigest();

  console.log('Building content GraphRAG (Graphify) for ranking boosts...');
  const { byCategory: raw, graphRag } = await enrichDigestWithGraphRag(researched, {
    stamp,
  });
  console.log(JSON.stringify({ graphRag }, null, 2));

  console.log('Validating & ranking by insight score...');
  const { byCategory, sectionOrder, report } = validateAndRankDigest(raw);
  console.log(
    JSON.stringify(
      {
        ranking: {
          kept: report.kept,
          dropped: report.dropped,
          sectionOrder: report.sectionOrder,
          categories: report.categories,
        },
        graphRag,
      },
      null,
      2
    )
  );

  const total = Object.values(byCategory).reduce((n, arr) => n + arr.length, 0);
  if (total === 0) {
    throw new Error('No digest entries passed validation / insight ranking');
  }

  // Sanitize fancy/unicode glyphs out of the final Hive Digest before send.
  const issue = sanitizeIssue(buildIssue({ date, byCategory, sectionOrder }));

  if (dryRun) {
    const archived = archiveIssue({
      stamp,
      date,
      issue,
      report,
      graphRag,
      sectionOrder,
      entries: total,
      dryRun: true,
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          subject: issue.subject,
          date,
          entries: total,
          sectionOrder,
          graphRag,
          archive: archived.repoDir,
          outDir: archived.outDir,
        },
        null,
        2
      )
    );
    return;
  }

  const to = parseRecipients(requireEnv('NEWSLETTER_TO_EMAILS'));
  if (!to.length) throw new Error('NEWSLETTER_TO_EMAILS parsed to empty list');

  // Archive before SMTP so a send failure still leaves the issue in digests/.
  let archived = archiveIssue({
    stamp,
    date,
    issue,
    report,
    graphRag,
    sectionOrder,
    entries: total,
    dryRun: false,
    messageId: null,
    recipients: to.length,
  });

  const issueKey = `hive-digest/${hourStamp()}`;

  console.log(`Sending Hive Digest for ${date} to ${to.length} recipient(s) via SMTP…`);
  const result = await sendSmtpEmail({
    to,
    subject: issue.subject,
    text: issue.text,
    html: issue.html,
    headers: {
      'X-Entity-Ref-ID': issueKey,
      'X-Hive-Digest-Date': stamp,
    },
  });

  if (result.rejected?.length) {
    throw new Error(`SMTP rejected recipients: ${result.rejected.join(', ')}`);
  }

  // Refresh archive meta with SMTP message id after a successful send.
  archived = archiveIssue({
    stamp,
    date,
    issue,
    report,
    graphRag,
    sectionOrder,
    entries: total,
    dryRun: false,
    messageId: result.messageId || null,
    recipients: to.length,
  });

  delete state.lastIssueNumber;

  state.runsCompleted = (state.runsCompleted || 0) + 1;
  state.lastSentAt = new Date().toISOString();
  state.history = [
    ...(state.history || []),
    {
      date,
      dateStamp: stamp,
      subject: issue.subject,
      messageId: result.messageId,
      sentAt: state.lastSentAt,
      recipients: to.length,
      sectionOrder,
      rankingKept: report.kept,
      rankingDropped: report.dropped,
      archive: `digests/${stamp}/`,
    },
  ].slice(-20);
  saveState(state);

  console.log(
    JSON.stringify(
      {
        ok: true,
        date,
        subject: issue.subject,
        messageId: result.messageId,
        accepted: result.accepted,
        recipients: to.length,
        runsCompleted: state.runsCompleted,
        sectionOrder,
        archive: archived.repoDir,
        outDir: archived.outDir,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
