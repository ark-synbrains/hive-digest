#!/usr/bin/env node
/**
 * /dev/digest newsletter agent — one-shot run.
 *
 * Generates a fresh issue (Anthropic + web search) and emails it via Resend
 * to every address in NEWSLETTER_TO_EMAILS (or NEWSLETTER_TO_EMAIL).
 *
 * Usage:
 *   node src/index.js
 *   node src/index.js --dry-run          # generate only, print markdown
 *   node src/index.js --fixture         # skip Anthropic; use sample issue
 */

import { loadConfig } from './config.js';
import { generateIssue } from './generate.js';
import { buildMarkdown, sendNewsletter } from './email.js';

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    fixture: argv.includes('--fixture'),
  };
}

function buildFixtureIssue() {
  const now = new Date();
  return {
    number: Number(now.toISOString().slice(0, 10).replace(/-/g, '')),
    date: now.toDateString(),
    isoDate: now.toISOString().slice(0, 10),
    byCategory: {
      model: [
        {
          headline: 'Fixture model update for agent smoke test',
          summary:
            'This is a sample entry used when the agent runs with --fixture. Replace by running without --fixture once ANTHROPIC_API_KEY is set.',
          source_name: '/dev/digest',
          source_url: 'https://github.com/ark-synbrains/dev-digest',
        },
      ],
      algorithm: [
        {
          headline: 'Fixture systems technique entry',
          summary:
            'Sample algorithms & systems lane content for dry pipeline testing of generate → render → send.',
          source_name: '/dev/digest',
          source_url: 'https://github.com/ark-synbrains/dev-digest',
        },
      ],
      product: [
        {
          headline: 'Fixture product release entry',
          summary:
            'Sample product & company releases lane content so the email template renders all three sections.',
          source_name: '/dev/digest',
          source_url: 'https://github.com/ark-synbrains/dev-digest',
        },
      ],
    },
    errors: {},
  };
}

export async function runOnce(options = {}) {
  const { dryRun = false, fixture = false } = options;
  const config = loadConfig({
    requireAnthropic: !dryRun && !fixture,
    requireResend: false,
  });

  console.log(
    `[dev-digest] generating issue (scope=${config.scope}${fixture ? ', fixture' : ''})…`
  );

  const issue = fixture
    ? buildFixtureIssue()
    : await generateIssue({
        apiKey: config.anthropicApiKey || requiredForGenerate(),
        model: config.model,
        scope: config.scope,
      });

  const entryCount = Object.values(issue.byCategory).reduce(
    (n, items) => n + (items?.length || 0),
    0
  );
  console.log(
    `[dev-digest] issue #${String(issue.number).padStart(3, '0')} ready — ${entryCount} entries` +
      (Object.keys(issue.errors || {}).length
        ? ` (${Object.keys(issue.errors).length} lane(s) failed)`
        : '')
  );

  if (dryRun) {
    console.log('\n--- markdown preview ---\n');
    console.log(buildMarkdown(issue));
    return { issue, sent: null, dryRun: true };
  }

  const sendConfig = loadConfig({
    requireAnthropic: false,
    requireResend: true,
  });
  console.log(
    `[dev-digest] sending to ${sendConfig.recipients.length} recipient(s) ` +
      `(${sendConfig.recipients.join(', ')}) from ${sendConfig.from} via Resend…`
  );

  const sent = await sendNewsletter({
    apiKey: sendConfig.resendApiKey,
    from: sendConfig.from,
    to: sendConfig.recipients,
    replyTo: sendConfig.replyTo,
    issue,
  });

  for (const result of sent.sent) {
    console.log(`[dev-digest] sent → ${result.to}: ${result.id}`);
  }
  for (const failure of sent.failed) {
    console.error(`[dev-digest] failed → ${failure.to}: ${failure.error}`);
  }
  console.log(
    `[dev-digest] done: ${sent.sent.length}/${sendConfig.recipients.length} delivered — ${sent.subject}`
  );

  if (sent.failed.length > 0) {
    throw new Error(
      `Partial send failure: ${sent.failed.length} of ${sendConfig.recipients.length} recipients failed`
    );
  }

  return { issue, sent, dryRun: false };
}

function requiredForGenerate() {
  throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('/src/index.js') ||
    process.argv[1].endsWith('\\src\\index.js') ||
    process.argv[1].endsWith('/index.js'));

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  runOnce(args).catch((err) => {
    console.error('[dev-digest] failed:', err.message || err);
    process.exit(1);
  });
}
