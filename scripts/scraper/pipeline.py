"""
Xplorers Scraper Pipeline
=========================
Downloads camping data from multiple sources, normalizes, geocodes,
deduplicates, and outputs a JSON file ready for Supabase import.

Usage:
    python scripts/scraper/pipeline.py [--source SOURCE] [--no-cache] [--no-geocode]

Sources:
    - osm       — OpenStreetMap (Overpass API), ~2400 campings
    - mendoza   — datosabiertos.mendoza.gov.ar, ~40 campings
    - rionegro  — turismo.rionegro.gov.ar, ~20 campings
    - neuquen   — turismo.neuquen.gob.ar, ~30 campings
    - cordoba   — stub (no public data)
    - buenosaires — stub (no public data)
    - all       — all of the above

Output:
    scripts/scraper/output/campings.json
"""

from __future__ import annotations

import argparse
import difflib
import json
import sys
import time
from collections import Counter
from pathlib import Path

from sources import osm, georef, geohash
from sources import mendoza, rionegro, neuquen, cordoba, buenosaires
from sources.utils import haversine_km

OUTPUT_DIR = Path(__file__).parent / "output"
OSM_CACHE = OUTPUT_DIR / "osm_raw.json"
OUTPUT_FILE = OUTPUT_DIR / "campings.json"

# Source registry: name → (runner function, cache path)
# Each runner returns list[dict] with normalized camping records
SOURCES = {
    "osm": "osm",
    "mendoza": "mendoza",
    "rionegro": "rionegro",
    "neuquen": "neuquen",
    "cordoba": "cordoba",
    "buenosaires": "buenosaires",
}


def run_osm(no_cache: bool) -> list[dict]:
    """Run OSM source: download + normalize."""
    cache = None if no_cache else OSM_CACHE
    elements = osm.download(cache_path=cache)
    return osm.process(elements)


def run_provincial(source_module, cache_path: Path | None) -> list[dict]:
    """Run a provincial scraper source."""
    return source_module.scrape(cache_path=cache_path)


def add_provinces(campings: list[dict]) -> list[dict]:
    """Add province info to each camping via reverse geocoding."""
    # Only geocode records that have coordinates but no province
    needs_province = [
        c for c in campings
        if c.get("latitude") is not None and not c.get("province")
    ]
    already_has = [
        c for c in campings
        if c.get("province") or c.get("latitude") is None
    ]

    if needs_province:
        coords = [(c["latitude"], c["longitude"]) for c in needs_province]
        locations = georef.reverse_geocode_batch(coords)

        for camping, location in zip(needs_province, locations):
            if location:
                camping["province"] = location["province"]
                camping["department"] = location.get("department")
            else:
                camping["province"] = None
                camping["department"] = None

    all_campings = already_has + needs_province

    # Filter out campings that have coords but no province (outside Argentina)
    before = len(all_campings)
    all_campings = [
        c for c in all_campings
        if c.get("province") or c.get("latitude") is None
    ]
    dropped = before - len(all_campings)
    if dropped:
        print(f"Dropped {dropped} campings outside Argentina", file=sys.stderr)

    return all_campings


def forward_geocode(campings: list[dict]) -> list[dict]:
    """Forward geocode records that lack lat/lon coordinates."""
    needs_coords = [
        c for c in campings
        if c.get("latitude") is None or c.get("longitude") is None
    ]
    if not needs_coords:
        return campings

    print(
        f"  {len(needs_coords)} records need forward geocoding",
        file=sys.stderr,
    )
    return georef.forward_geocode_batch(campings)


def add_geohashes(campings: list[dict]) -> list[dict]:
    """Add geohash to each camping."""
    for c in campings:
        if c.get("latitude") is not None and c.get("longitude") is not None:
            c["geohash"] = geohash.encode(
                c["latitude"], c["longitude"], precision=5
            )
        else:
            c["geohash"] = None
    return campings


def dedup_across_sources(campings: list[dict]) -> list[dict]:
    """
    Deduplicate campings across sources using geohash proximity + name similarity.

    Strategy:
    - Group by geohash prefix-4 (~40km cells)
    - Within each cell: pairwise Haversine + SequenceMatcher
    - If distance < 200m AND name similarity > 0.8 → duplicate
    - Merge: keep OSM record (better coords), enrich with provincial data
    """
    if not campings:
        return campings

    # Group by geohash prefix (4 chars)
    cells: dict[str, list[int]] = {}
    for i, c in enumerate(campings):
        gh = (c.get("geohash") or "")[:4]
        if gh:
            cells.setdefault(gh, []).append(i)

    # Track which indices are duplicates (to remove)
    duplicates: set[int] = set()

    for cell_indices in cells.values():
        if len(cell_indices) < 2:
            continue

        # Pairwise comparison within cell
        for a_pos in range(len(cell_indices)):
            a_idx = cell_indices[a_pos]
            if a_idx in duplicates:
                continue
            a = campings[a_idx]

            for b_pos in range(a_pos + 1, len(cell_indices)):
                b_idx = cell_indices[b_pos]
                if b_idx in duplicates:
                    continue
                b = campings[b_idx]

                # Same source → skip (intra-source dedup is done per source)
                if a["source"] == b["source"]:
                    continue

                # Check distance
                dist = haversine_km(
                    a["latitude"], a["longitude"],
                    b["latitude"], b["longitude"],
                )
                if dist > 0.2:  # 200m
                    continue

                # Check name similarity
                similarity = difflib.SequenceMatcher(
                    None,
                    a["name"].lower(),
                    b["name"].lower(),
                ).ratio()
                if similarity < 0.8:
                    continue

                # Duplicate found — merge
                # OSM is canonical (better coords), provincial adds contact/type
                if a["source"] == "osm":
                    canonical, enrichment = a, b
                    remove_idx = b_idx
                elif b["source"] == "osm":
                    canonical, enrichment = b, a
                    remove_idx = a_idx
                else:
                    # Both provincial — keep the first one
                    canonical, enrichment = a, b
                    remove_idx = b_idx

                # Enrich canonical with provincial data
                if not canonical.get("contact") and enrichment.get("contact"):
                    canonical["contact"] = enrichment["contact"]
                if not canonical.get("type") and enrichment.get("type"):
                    canonical["type"] = enrichment["type"]

                duplicates.add(remove_idx)

    before = len(campings)
    campings = [c for i, c in enumerate(campings) if i not in duplicates]
    deduped = before - len(campings)
    if deduped:
        print(
            f"Deduplication: merged {deduped} cross-source duplicates",
            file=sys.stderr,
        )

    return campings


def to_supabase_format(campings: list[dict]) -> list[dict]:
    """Convert to the format matching our Supabase campings table."""
    records = []
    for c in campings:
        record = {
            "name": c["name"],
            "slug": c["slug"],
            "latitude": c["latitude"],
            "longitude": c["longitude"],
            "province": c["province"],
            "geohash": c["geohash"],
            "type": c.get("type"),
            "amenities": c.get("amenities", {}),
            "prices": None,
            "contact": c.get("contact"),
            "photos": [],
            "source": c["source"],
            "verified": False,
        }
        records.append(record)
    return records


def main():
    parser = argparse.ArgumentParser(description="Xplorers Scraper Pipeline")
    parser.add_argument(
        "--source",
        default="all",
        choices=["all", "osm", "mendoza", "rionegro", "neuquen",
                 "cordoba", "buenosaires"],
        help="Which source(s) to scrape (default: all)",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Force fresh download (ignore cached data)",
    )
    parser.add_argument(
        "--no-geocode",
        action="store_true",
        help="Skip all geocoding (reverse + forward)",
    )
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    start = time.time()

    # --- Step 1: Run selected sources ---
    selected = (
        list(SOURCES.keys()) if args.source == "all" else [args.source]
    )
    all_campings: list[dict] = []

    source_modules = {
        "mendoza": mendoza,
        "rionegro": rionegro,
        "neuquen": neuquen,
        "cordoba": cordoba,
        "buenosaires": buenosaires,
    }

    cache_paths = {
        "mendoza": OUTPUT_DIR / "mendoza_raw.csv",
        "rionegro": OUTPUT_DIR / "rionegro_raw.html",
        "neuquen": OUTPUT_DIR / "neuquen_raw.json",
        "cordoba": None,
        "buenosaires": None,
    }

    for source_name in selected:
        print(
            f"\n=== Source: {source_name} ===",
            file=sys.stderr,
        )

        if source_name == "osm":
            campings = run_osm(no_cache=args.no_cache)
        else:
            module = source_modules[source_name]
            cache = None if args.no_cache else cache_paths.get(source_name)
            campings = run_provincial(module, cache_path=cache)

        print(
            f"  → {len(campings)} records from {source_name}",
            file=sys.stderr,
        )
        all_campings.extend(campings)

    print(
        f"\n=== Total raw records: {len(all_campings)} ===",
        file=sys.stderr,
    )

    if not args.no_geocode:
        # --- Step 2: Forward geocode records without coordinates ---
        print("\n=== Step 2: Forward geocode ===", file=sys.stderr)
        all_campings = forward_geocode(all_campings)

        # --- Step 3: Reverse geocode → province (for OSM records) ---
        print("\n=== Step 3: Reverse geocode (province) ===", file=sys.stderr)
        all_campings = add_provinces(all_campings)
    else:
        print("\n=== Skipping geocoding ===", file=sys.stderr)
        # Remove records without coordinates when geocoding is disabled
        without_coords = sum(
            1 for c in all_campings
            if c.get("latitude") is None or c.get("longitude") is None
        )
        if without_coords:
            print(
                f"  Warning: dropping {without_coords} records without "
                f"coordinates (use geocoding to resolve them)",
                file=sys.stderr,
            )
        all_campings = [
            c for c in all_campings
            if c.get("latitude") is not None and c.get("longitude") is not None
        ]
        for c in all_campings:
            c.setdefault("province", None)
            c.setdefault("department", None)

    # --- Step 4: Generate geohashes ---
    print("\n=== Step 4: Generate geohashes ===", file=sys.stderr)
    all_campings = add_geohashes(all_campings)

    # --- Step 5: Cross-source deduplication ---
    if len(selected) > 1:
        print("\n=== Step 5: Cross-source deduplication ===", file=sys.stderr)
        all_campings = dedup_across_sources(all_campings)
    else:
        print("\n=== Step 5: Skipping dedup (single source) ===", file=sys.stderr)

    # --- Step 6: Format for Supabase ---
    print("\n=== Step 6: Format output ===", file=sys.stderr)
    records = to_supabase_format(all_campings)

    # --- Step 7: Write output ---
    source_label = args.source if args.source != "all" else "multi"
    output = {
        "source": source_label,
        "sources_used": selected,
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(records),
        "campings": records,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start
    print(f"\n{'=' * 50}", file=sys.stderr)
    print(f"Done! {len(records)} campings → {OUTPUT_FILE}", file=sys.stderr)
    print(f"Time: {elapsed:.1f}s", file=sys.stderr)

    # Source breakdown
    source_counts = Counter(r["source"] for r in records)
    print(f"\nBy source:", file=sys.stderr)
    for src, count in source_counts.most_common():
        print(f"  {src}: {count}", file=sys.stderr)

    # Province breakdown
    provinces = Counter(r["province"] for r in records if r["province"])
    print(f"\nBy province:", file=sys.stderr)
    for prov, count in provinces.most_common():
        print(f"  {prov}: {count}", file=sys.stderr)


if __name__ == "__main__":
    main()
