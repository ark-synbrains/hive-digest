#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { researchDigest } from './research.mjs';
import { buildIssue } from './render.mjs';
import { sendSmtpEmail } from './smtp.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATE_PATH = join(ROOT, 'state.json');

function loadState() {
  if (!existsSync(STATE_PATH)) {
    return { lastIssueNumber: 1, runsCompleted: 0, lastSentAt: null, history: [] };
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

function formatDate(d = new Date()) {
  return d.toDateString();
}

function hourStamp(d = new Date()) {
  return d.toISOString().slice(0, 13).replace('T', '-');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const maxRuns = Number(process.env.DIGEST_MAX_RUNS || '0'); // 0 = unlimited
  const state = loadState();

  if (maxRuns > 0 && state.runsCompleted >= maxRuns) {
    console.log(
      JSON.stringify({
        ok: true,
        skipped: true,
        reason: `Trial complete: ${state.runsCompleted}/${maxRuns} runs already sent`,
        runsCompleted: state.runsCompleted,
      })
    );
    process.exit(0);
  }

  console.log('Researching digest lanes…');
  const byCategory = await researchDigest();
  const total = Object.values(byCategory).reduce((n, arr) => n + arr.length, 0);
  if (total === 0) throw new Error('No digest entries found from research sources');

  const number = process.env.DIGEST_ISSUE_NUMBER
    ? Number(process.env.DIGEST_ISSUE_NUMBER)
    : (state.lastIssueNumber || 1) + 1;
  if (!Number.isFinite(number) || number < 1) {
    throw new Error(`Invalid DIGEST_ISSUE_NUMBER: ${process.env.DIGEST_ISSUE_NUMBER}`);
  }
  const issue = buildIssue({ number, date: formatDate(), byCategory });

  if (dryRun) {
    const outDir = join(ROOT, 'out');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `issue-${String(number).padStart(3, '0')}.html`), issue.html);
    writeFileSync(join(outDir, `issue-${String(number).padStart(3, '0')}.txt`), issue.text);
    console.log(JSON.stringify({ ok: true, dryRun: true, subject: issue.subject, entries: total }, null, 2));
    return;
  }

  const to = parseRecipients(requireEnv('NEWSLETTER_TO_EMAILS'));
  if (!to.length) throw new Error('NEWSLETTER_TO_EMAILS parsed to empty list');

  const issueKey = `dev-digest/issue-${String(number).padStart(3, '0')}/${hourStamp()}`;

  console.log(`Sending issue #${number} to ${to.length} recipient(s) via SMTP…`);
  const result = await sendSmtpEmail({
    to,
    subject: issue.subject,
    text: issue.text,
    html: issue.html,
    headers: {
      'X-Entity-Ref-ID': issueKey,
      'X-Dev-Digest-Issue': String(number).padStart(3, '0'),
    },
  });

  if (result.rejected?.length) {
    throw new Error(`SMTP rejected recipients: ${result.rejected.join(', ')}`);
  }

  state.lastIssueNumber = number;
  state.runsCompleted = (state.runsCompleted || 0) + 1;
  state.lastSentAt = new Date().toISOString();
  state.history = [
    ...(state.history || []),
    {
      number,
      subject: issue.subject,
      messageId: result.messageId,
      sentAt: state.lastSentAt,
      recipients: to.length,
    },
  ].slice(-20);
  saveState(state);

  const remaining =
    maxRuns > 0 ? Math.max(0, maxRuns - state.runsCompleted) : null;

  console.log(
    JSON.stringify(
      {
        ok: true,
        issue: number,
        subject: issue.subject,
        messageId: result.messageId,
        accepted: result.accepted,
        recipients: to.length,
        runsCompleted: state.runsCompleted,
        remainingTrialRuns: remaining,
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
