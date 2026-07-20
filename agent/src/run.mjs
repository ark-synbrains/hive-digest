#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { researchDigest } from './research.mjs';
import { validateAndRankDigest } from './validate.mjs';
import { buildIssue } from './render.mjs';
import { sanitizeIssue } from './sanitize.mjs';
import { sendSmtpEmail } from './smtp.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATE_PATH = join(ROOT, 'state.json');

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

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const state = loadState();
  const now = new Date();
  const date = formatDate(now);
  const stamp = dateStamp(now);

  console.log('Researching Hive Digest lanes...');
  const raw = await researchDigest();

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
      },
      null,
      2
    )
  );

  const total = Object.values(byCategory).reduce((n, arr) => n + arr.length, 0);
  if (total === 0) {
    throw new Error('No digest entries passed validation / insight ranking');
  }

  // Sanitize fancy/unicode glyphs out of the final newsletter before send.
  const issue = sanitizeIssue(buildIssue({ date, byCategory, sectionOrder }));

  if (dryRun) {
    const outDir = join(ROOT, 'out');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `digest-${stamp}.html`), issue.html);
    writeFileSync(join(outDir, `digest-${stamp}.txt`), issue.text);
    writeFileSync(join(outDir, `digest-${stamp}.ranking.json`), JSON.stringify(report, null, 2) + '\n');
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          subject: issue.subject,
          date,
          entries: total,
          sectionOrder,
        },
        null,
        2
      )
    );
    return;
  }

  const to = parseRecipients(requireEnv('NEWSLETTER_TO_EMAILS'));
  if (!to.length) throw new Error('NEWSLETTER_TO_EMAILS parsed to empty list');

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
