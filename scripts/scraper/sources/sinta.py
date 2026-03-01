"""
SINTA Scraper — datos.yvera.tur.ar
Importa datos de alojamientos turísticos, filtra campings,
normaliza schema y geocodifica con georef-ar-api.

Usage:
    python scripts/scraper/sources/sinta.py

Output:
    scripts/scraper/output/campings_sinta.json
"""

import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError

SINTA_BASE_URL = "https://datos.yvera.tur.ar"
GEOREF_API_URL = "https://apis.datos.gob.ar/georef/api"

OUTPUT_DIR = Path(__file__).parent.parent / "output"
OUTPUT_FILE = OUTPUT_DIR / "campings_sinta.json"


def fetch_json(url: str) -> dict:
    """Fetch JSON from URL with basic error handling."""
    req = Request(url, headers={"User-Agent": "Xplorers-Scraper/1.0"})
    try:
        with urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except URLError as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        raise


def geocode_address(address: str, province: str) -> dict | None:
    """Geocode an address using georef-ar-api."""
    params = urlencode({
        "direccion": address,
        "provincia": province,
        "max": 1,
    })
    url = f"{GEOREF_API_URL}/direcciones?{params}"

    try:
        data = fetch_json(url)
        if data.get("direcciones"):
            loc = data["direcciones"][0]["ubicacion"]
            return {"lat": loc["lat"], "lon": loc["lon"]}
    except Exception as e:
        print(f"Geocoding failed for '{address}', {province}: {e}", file=sys.stderr)

    return None


def normalize_camping(raw: dict, province: str) -> dict | None:
    """Normalize a raw SINTA record into our camping schema."""
    name = raw.get("nombre") or raw.get("name")
    if not name:
        return None

    lat = raw.get("latitud") or raw.get("lat")
    lon = raw.get("longitud") or raw.get("lng") or raw.get("lon")

    # Try geocoding if no coordinates
    if not lat or not lon:
        address = raw.get("direccion") or raw.get("domicilio", "")
        if address:
            coords = geocode_address(address, province)
            if coords:
                lat, lon = coords["lat"], coords["lon"]

    if not lat or not lon:
        print(f"Skipping '{name}': no coordinates", file=sys.stderr)
        return None

    return {
        "name": name.strip(),
        "latitude": float(lat),
        "longitude": float(lon),
        "province": province,
        "source": "sinta",
        "amenities": {},
        "contact": {
            "phone": raw.get("telefono"),
            "email": raw.get("mail"),
            "website": raw.get("web"),
        },
        "raw": raw,
    }


def main():
    """Main scraper entry point."""
    print("SINTA Scraper — Xplorers")
    print("=" * 40)

    # TODO: Implement actual SINTA API calls once we have the exact endpoints
    # The SINTA data portal at datos.yvera.tur.ar provides CSV/JSON datasets
    # of tourist accommodations by province.
    #
    # Steps:
    # 1. Download dataset catalog from SINTA
    # 2. Filter records where tipo = 'camping' or similar
    # 3. Normalize each record
    # 4. Geocode missing coordinates
    # 5. Export to JSON

    print("\nNOTE: This is a scaffold. Implement actual SINTA API integration.")
    print("See: https://datos.yvera.tur.ar")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sample_data = {
        "source": "sinta",
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "campings": [],
        "total": 0,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(sample_data, f, ensure_ascii=False, indent=2)

    print(f"\nOutput: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
