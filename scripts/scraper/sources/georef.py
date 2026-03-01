"""
Reverse geocoding via georef-ar-api.
Resolves (lat, lon) → province + department for Argentine coordinates.

API docs: https://datosgobar.github.io/georef-ar-api/
"""

from __future__ import annotations

import json
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import URLError

GEOREF_API_URL = "https://apis.datos.gob.ar/georef/api"
BATCH_SIZE = 500
DELAY_BETWEEN_BATCHES = 1.0  # seconds


def reverse_geocode_batch(
    coords: list[tuple[float, float]],
) -> list[dict | None]:
    """
    Reverse geocode a list of (lat, lon) tuples.
    Returns a list of dicts with province/department info, or None for failures.
    """
    results: list[dict | None] = [None] * len(coords)

    for batch_start in range(0, len(coords), BATCH_SIZE):
        batch = coords[batch_start : batch_start + BATCH_SIZE]
        batch_end = batch_start + len(batch)
        print(
            f"  Geocoding batch {batch_start + 1}-{batch_end} of {len(coords)}...",
            file=sys.stderr,
        )

        payload = {
            "ubicaciones": [
                {"lat": lat, "lon": lon, "aplanar": True}
                for lat, lon in batch
            ]
        }

        try:
            body = json.dumps(payload).encode("utf-8")
            req = Request(
                f"{GEOREF_API_URL}/ubicacion",
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Xplorers-Scraper/1.0",
                },
                method="POST",
            )
            with urlopen(req, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))

            for i, result in enumerate(data.get("resultados", [])):
                ubicacion = result.get("ubicacion", {})
                province_name = ubicacion.get("provincia_nombre")
                if province_name:
                    results[batch_start + i] = {
                        "province": province_name,
                        "department": ubicacion.get("departamento_nombre"),
                        "municipality": ubicacion.get("municipio_nombre"),
                    }
        except (URLError, json.JSONDecodeError, KeyError) as e:
            print(f"  Batch geocoding error: {e}", file=sys.stderr)

        if batch_end < len(coords):
            time.sleep(DELAY_BETWEEN_BATCHES)

    resolved = sum(1 for r in results if r is not None)
    print(f"  Resolved {resolved}/{len(coords)} locations", file=sys.stderr)
    return results
