"""
Xplorers Scraper Pipeline
=========================
Downloads camping data from multiple sources, normalizes, geocodes,
and outputs a JSON file ready for Supabase import.

Usage:
    python scripts/scraper/pipeline.py [--no-cache] [--no-geocode]

Sources:
    - OpenStreetMap (Overpass API) — primary, ~2400 campings
    - SINTA (datos.yvera.tur.ar) — restricted, future enrichment

Output:
    scripts/scraper/output/campings.json
"""

import argparse
import json
import sys
import time
from pathlib import Path

from sources import osm, georef, geohash

OUTPUT_DIR = Path(__file__).parent / "output"
OSM_CACHE = OUTPUT_DIR / "osm_raw.json"
OUTPUT_FILE = OUTPUT_DIR / "campings.json"


def add_provinces(campings: list[dict]) -> list[dict]:
    """Add province info to each camping via reverse geocoding."""
    coords = [(c["latitude"], c["longitude"]) for c in campings]
    locations = georef.reverse_geocode_batch(coords)

    for camping, location in zip(campings, locations):
        if location:
            camping["province"] = location["province"]
            camping["department"] = location.get("department")
        else:
            camping["province"] = None
            camping["department"] = None

    # Filter out campings outside Argentina (no province resolved)
    before = len(campings)
    campings = [c for c in campings if c["province"]]
    dropped = before - len(campings)
    if dropped:
        print(f"Dropped {dropped} campings outside Argentina", file=sys.stderr)

    return campings


def add_geohashes(campings: list[dict]) -> list[dict]:
    """Add geohash to each camping."""
    for c in campings:
        c["geohash"] = geohash.encode(c["latitude"], c["longitude"], precision=5)
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
        "--no-cache",
        action="store_true",
        help="Force fresh download from Overpass API",
    )
    parser.add_argument(
        "--no-geocode",
        action="store_true",
        help="Skip reverse geocoding (province will be null)",
    )
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    start = time.time()

    # --- Step 1: Download from OSM ---
    print("\n=== Step 1: Download from OpenStreetMap ===", file=sys.stderr)
    cache = None if args.no_cache else OSM_CACHE
    elements = osm.download(cache_path=cache)

    # --- Step 2: Normalize ---
    print("\n=== Step 2: Normalize records ===", file=sys.stderr)
    campings = osm.process(elements)

    # --- Step 3: Reverse geocode → province ---
    if not args.no_geocode:
        print("\n=== Step 3: Reverse geocode (province) ===", file=sys.stderr)
        campings = add_provinces(campings)
    else:
        print("\n=== Step 3: Skipping geocode ===", file=sys.stderr)
        for c in campings:
            c.setdefault("province", None)
            c.setdefault("department", None)

    # --- Step 4: Generate geohashes ---
    print("\n=== Step 4: Generate geohashes ===", file=sys.stderr)
    campings = add_geohashes(campings)

    # --- Step 5: Format for Supabase ---
    print("\n=== Step 5: Format output ===", file=sys.stderr)
    records = to_supabase_format(campings)

    # --- Step 6: Write output ---
    output = {
        "source": "osm",
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

    # Province breakdown
    from collections import Counter

    provinces = Counter(r["province"] for r in records if r["province"])
    print(f"\nBy province:", file=sys.stderr)
    for prov, count in provinces.most_common():
        print(f"  {prov}: {count}", file=sys.stderr)


if __name__ == "__main__":
    main()
