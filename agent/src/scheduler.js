#!/usr/bin/env node
/**
 * Long-running scheduler that runs the newsletter agent every N hours
 * (default 12). Prefer the GitHub Actions workflow for production;
 * use this when hosting the agent as a persistent process.
 *
 * Usage:
 *   NEWSLETTER_INTERVAL_HOURS=12 node src/scheduler.js
 *   node src/scheduler.js --once          # single run then exit
 *   node src/scheduler.js --fixture       # fixture content (testing)
 */

import { loadConfig } from './config.js';
import { runOnce } from './index.js';

function parseArgs(argv) {
  return {
    once: argv.includes('--once'),
    fixture: argv.includes('--fixture'),
    dryRun: argv.includes('--dry-run'),
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  // Load interval without requiring secrets yet (runOnce validates when sending)
  const config = loadConfig({ requireSendSecrets: false });
  const intervalMs = config.intervalHours * 60 * 60 * 1000;

  console.log(
    `[dev-digest] scheduler started — every ${config.intervalHours}h → ${config.to}`
  );

  // Run immediately on start, then every interval
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const started = Date.now();
    try {
      await runOnce({ fixture: args.fixture, dryRun: args.dryRun });
    } catch (err) {
      console.error('[dev-digest] run failed:', err.message || err);
    }

    if (args.once) {
      console.log('[dev-digest] --once set; exiting');
      return;
    }

    const elapsed = Date.now() - started;
    const wait = Math.max(intervalMs - elapsed, 5_000);
    const nextAt = new Date(Date.now() + wait).toISOString();
    console.log(`[dev-digest] next run at ${nextAt}`);
    await sleep(wait);
  }
}

main().catch((err) => {
  console.error('[dev-digest] scheduler crashed:', err.message || err);
  process.exit(1);
});
