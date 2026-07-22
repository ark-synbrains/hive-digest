# Hive Digest archive

Generated issues are saved here automatically by `agent/` on every dry-run
(`npm run generate`) and every live send (`npm start`).

## Layout

```
digests/
  README.md
  YYYY-MM-DD/
    hive-digest.html    # emailed (or dry-run) HTML body
    hive-digest.txt     # plain-text body
    ranking.json        # insight ranking report (scores for logs only)
    graphrag.json       # content GraphRAG summary for that run
    meta.json           # subject, dryRun/sent flags, messageId, section order
```

Same-day re-runs overwrite that date’s folder (monthly schedule is once per month).

Local scratch copies also land under `agent/out/` (gitignored).
