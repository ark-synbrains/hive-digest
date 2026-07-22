# `agent/out/` — tracked run artifacts

This folder is **committed to git**. Every dry-run (`npm run generate`) and live
send (`npm start`) writes here in addition to the canonical archive under
`digests/YYYY-MM-DD/`.

When you change what is written here, update this README, `digests/README.md`,
`docs/ARCHITECTURE.md`, and the monthly workflow commit step — see
[`docs/DOCUMENTATION.md`](../../docs/DOCUMENTATION.md).

## Layout

```
agent/out/
  README.md
  digest-YYYY-MM-DD.html
  digest-YYYY-MM-DD.txt
  digest-YYYY-MM-DD.ranking.json
  digest-YYYY-MM-DD.graphrag.json
  digest-graph/
    YYYY-MM-DD/
      extraction.json
      graph.json
      boosts.json
      summary.json
      analysis.json
      corpus/…          # markdown snapshots of research candidates
```

- Prefer **`digests/`** as the human-facing issue archive (HTML/text + meta).
- Prefer **`agent/out/`** when you want the full run scratch pad, including the
  content GraphRAG graph for that date.

Still excluded from the **codebase** Graphify index via `.graphifyignore`
(so newsletter HTML does not pollute `graphify-out/`).
