#!/usr/bin/env python3
"""Build a Graphify content graph from digest extraction JSON and emit ranking boosts.

Used by agent/src/graphrag.mjs. Soft dependency: requires graphifyy (NetworkX).
Does not call an LLM — structural build + cluster + god-node analysis only.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def compute_boosts(G, communities: dict[int, list[str]], gods: list[dict]) -> dict[str, dict]:
    """Score each entry node for GraphRAG ranking boosts (0–12)."""
    god_ids = {g["id"] for g in gods[:8]}
    god_degree = {g["id"]: int(g.get("degree") or 0) for g in gods}

    # Community size for each node
    node_community: dict[str, int] = {}
    community_size: dict[int, int] = {}
    for cid, members in communities.items():
        community_size[cid] = len(members)
        for nid in members:
            node_community[nid] = cid

    boosts: dict[str, dict] = {}
    for nid, data in G.nodes(data=True):
        if data.get("file_type") != "document":
            continue
        reasons: list[str] = []
        boost = 0.0

        neighbors = list(G.neighbors(nid))
        concept_neighbors = [
            n for n in neighbors if G.nodes[n].get("file_type") == "concept"
        ]
        entry_neighbors = [
            n for n in neighbors if G.nodes[n].get("file_type") == "document" and n != nid
        ]

        # Shared-concept hubs (Graphify "god nodes" among concepts)
        hub_hits = [n for n in concept_neighbors if n in god_ids]
        if hub_hits:
            hub_strength = sum(god_degree.get(h, 1) for h in hub_hits)
            add = clamp(2 + hub_strength * 0.6, 2, 7)
            boost += add
            labels = [G.nodes[h].get("label", h) for h in hub_hits[:3]]
            reasons.append(f"linked to concept hub(s): {', '.join(labels)}")

        # Multi-item theme community
        cid = node_community.get(nid)
        if cid is not None and community_size.get(cid, 0) >= 3:
            boost += 2
            reasons.append(f"belongs to theme community of {community_size[cid]} nodes")

        # Cross-lane / cross-entry bridges
        if entry_neighbors:
            boost += clamp(len(entry_neighbors) * 1.5, 1, 4)
            reasons.append(f"bridges {len(entry_neighbors)} related digests item(s)")

        # Isolated entries: no boost
        boost = round(clamp(boost, 0, 12))
        if boost <= 0:
            continue
        boosts[nid] = {
            "boost": boost,
            "reasons": reasons,
            "degree": int(G.degree(nid)),
            "community": cid,
            "label": data.get("label"),
        }
    return boosts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extraction", required=True, help="Path to extraction JSON")
    parser.add_argument("--out-dir", required=True, help="Output directory for graph artifacts")
    parser.add_argument("--root", default=".", help="Root for relativizing source_file paths")
    args = parser.parse_args()

    try:
        from graphify.analyze import god_nodes, surprising_connections
        from graphify.build import build_from_json
        from graphify.cluster import cluster, score_all
        from graphify.export import to_json
    except ImportError as err:
        print(json.dumps({"ok": False, "error": f"graphify import failed: {err}"}))
        return 2

    extraction_path = Path(args.extraction)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    extraction = json.loads(extraction_path.read_text(encoding="utf-8"))
    G = build_from_json(extraction, root=args.root, directed=False)
    if G.number_of_nodes() == 0:
        print(json.dumps({"ok": False, "error": "empty content graph"}))
        return 1

    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    boosts = compute_boosts(G, communities, gods)

    # Write Graphify-compatible artifacts (separate from repo codebase graphify-out/)
    graph_path = out_dir / "graph.json"
    to_json(G, communities, str(graph_path))
    (out_dir / "boosts.json").write_text(
        json.dumps(boosts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (out_dir / "analysis.json").write_text(
        json.dumps(
            {
                "gods": gods,
                "surprises": surprises,
                "cohesion": {str(k): v for k, v in cohesion.items()},
                "communities": {str(k): v for k, v in communities.items()},
                "nodes": G.number_of_nodes(),
                "edges": G.number_of_edges(),
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "ok": True,
                "nodes": G.number_of_nodes(),
                "edges": G.number_of_edges(),
                "communities": len(communities),
                "boosted": len(boosts),
                "graph": str(graph_path),
                "boosts": str(out_dir / "boosts.json"),
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
