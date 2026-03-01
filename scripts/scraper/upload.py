"""
Upload scraped campings to Supabase.

Reads the pipeline output JSON and upserts records via the Supabase REST API.
Uses the slug as the conflict key to avoid duplicates.

Usage:
    python scripts/scraper/upload.py [--dry-run] [--file PATH]

Requires environment variables:
    SUPABASE_URL — project URL (e.g. https://xxx.supabase.co)
    SUPABASE_SERVICE_ROLE_KEY — service role key (NOT the anon key)
"""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

DEFAULT_INPUT = Path(__file__).parent / "output" / "campings.json"
BATCH_SIZE = 100


def load_campings(path: Path) -> list[dict]:
    """Load campings from the pipeline output JSON."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data["campings"]


def to_insert_record(camping: dict) -> dict:
    """Convert a camping dict to a Supabase insert payload."""
    lat = camping["latitude"]
    lon = camping["longitude"]

    return {
        "name": camping["name"],
        "slug": camping["slug"],
        "location": f"SRID=4326;POINT({lon} {lat})",
        "province": camping["province"],
        "geohash": camping["geohash"],
        "type": camping.get("type"),
        "amenities": json.dumps(camping.get("amenities", {})),
        "prices": json.dumps(camping["prices"]) if camping.get("prices") else None,
        "contact": json.dumps(camping["contact"]) if camping.get("contact") else None,
        "photos": camping.get("photos", []),
        "source": camping["source"],
        "verified": camping.get("verified", False),
    }


def upload_batch(
    records: list[dict],
    supabase_url: str,
    service_key: str,
) -> int:
    """Upload a batch of records to Supabase via REST API with upsert."""
    url = f"{supabase_url}/rest/v1/campings"
    body = json.dumps(records).encode("utf-8")

    req = Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Prefer": "resolution=merge-duplicates",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=30) as response:
            status = response.status
            if status in (200, 201):
                return len(records)
    except HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"Upload error ({e.code}): {error_body}", file=sys.stderr)
        return 0
    except URLError as e:
        print(f"Network error: {e}", file=sys.stderr)
        return 0

    return 0


def main():
    parser = argparse.ArgumentParser(description="Upload campings to Supabase")
    parser.add_argument(
        "--file",
        type=Path,
        default=DEFAULT_INPUT,
        help="Path to campings.json",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print records without uploading",
    )
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not args.dry_run and (not supabase_url or not service_key):
        print(
            "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
            file=sys.stderr,
        )
        print("Use --dry-run to preview without uploading", file=sys.stderr)
        sys.exit(1)

    campings = load_campings(args.file)
    print(f"Loaded {len(campings)} campings from {args.file}", file=sys.stderr)

    records = [to_insert_record(c) for c in campings]

    if args.dry_run:
        print(json.dumps(records[:3], indent=2, ensure_ascii=False))
        print(f"\n... and {len(records) - 3} more", file=sys.stderr)
        return

    uploaded = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        n = upload_batch(batch, supabase_url, service_key)
        uploaded += n
        print(
            f"  Uploaded {i + n}/{len(records)}",
            file=sys.stderr,
        )

    print(f"\nDone! Uploaded {uploaded}/{len(records)} campings", file=sys.stderr)


if __name__ == "__main__":
    main()
