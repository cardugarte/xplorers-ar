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


def _forward_via_localidades(records: list[dict]) -> None:
    """
    Geocode records by locality name using /localidades endpoint.
    Falls back to locality centroid (~1km precision). Mutates in-place.
    """
    needs = [
        r for r in records
        if r.get("latitude") is None and r.get("locality")
    ]
    if not needs:
        return

    print(
        f"  Locality fallback for {len(needs)} records...",
        file=sys.stderr,
    )

    for batch_start in range(0, len(needs), BATCH_SIZE):
        batch = needs[batch_start : batch_start + BATCH_SIZE]
        batch_end = batch_start + len(batch)

        queries = []
        for r in batch:
            query = {
                "nombre": r["locality"],
                "max": 1,
                "campos": "nombre,centroide",
            }
            if r.get("province"):
                query["provincia"] = r["province"]
            queries.append(query)

        payload = {"localidades": queries}

        try:
            body = json.dumps(payload).encode("utf-8")
            req = Request(
                f"{GEOREF_API_URL}/localidades",
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
                localidades = result.get("localidades", [])
                if localidades:
                    centroide = localidades[0].get("centroide", {})
                    lat = centroide.get("lat")
                    lon = centroide.get("lon")
                    if lat is not None and lon is not None:
                        batch[i]["latitude"] = lat
                        batch[i]["longitude"] = lon
        except (URLError, json.JSONDecodeError, KeyError) as e:
            print(f"  Locality geocoding error: {e}", file=sys.stderr)

        if batch_end < len(needs):
            time.sleep(DELAY_BETWEEN_BATCHES)

    resolved = sum(
        1 for r in needs
        if r.get("latitude") is not None
    )
    print(
        f"  Locality fallback resolved {resolved}/{len(needs)}",
        file=sys.stderr,
    )


def _forward_via_direcciones(records: list[dict]) -> None:
    """
    Geocode records with street addresses using /direcciones endpoint.
    Mutates in-place.
    """
    needs = [
        r for r in records
        if r.get("latitude") is None and r.get("address")
    ]
    if not needs:
        return

    print(
        f"  Address geocoding for {len(needs)} records...",
        file=sys.stderr,
    )

    for batch_start in range(0, len(needs), BATCH_SIZE):
        batch = needs[batch_start : batch_start + BATCH_SIZE]
        batch_end = batch_start + len(batch)

        queries = []
        for r in batch:
            parts = [r["address"]]
            if r.get("locality"):
                parts.append(r["locality"])
            query = {"direccion": ", ".join(parts), "max": 1}
            if r.get("province"):
                query["provincia"] = r["province"]
            queries.append(query)

        payload = {"direcciones": queries}

        try:
            body = json.dumps(payload).encode("utf-8")
            req = Request(
                f"{GEOREF_API_URL}/direcciones",
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
                direcciones = result.get("direcciones", [])
                if direcciones:
                    ubicacion = direcciones[0].get("ubicacion", {})
                    lat = ubicacion.get("lat")
                    lon = ubicacion.get("lon")
                    if lat is not None and lon is not None:
                        batch[i]["latitude"] = lat
                        batch[i]["longitude"] = lon
        except (URLError, json.JSONDecodeError, KeyError) as e:
            print(f"  Address geocoding error: {e}", file=sys.stderr)

        if batch_end < len(needs):
            time.sleep(DELAY_BETWEEN_BATCHES)


def forward_geocode_batch(records: list[dict]) -> list[dict]:
    """
    Forward geocode records that lack lat/lon.

    Two-pass strategy:
    1. Try /direcciones for records with street addresses (precise)
    2. Fall back to /localidades for remaining records (locality centroid)

    Mutates records in-place. Returns only records with coordinates.
    """
    needs_geocoding = [
        r for r in records
        if r.get("latitude") is None or r.get("longitude") is None
    ]
    if not needs_geocoding:
        print("  No records need forward geocoding", file=sys.stderr)
        return records

    print(
        f"  Forward geocoding {len(needs_geocoding)} records...",
        file=sys.stderr,
    )

    # Pass 1: try street address geocoding
    _forward_via_direcciones(records)

    # Pass 2: locality fallback for still-unresolved records
    _forward_via_localidades(records)

    resolved = sum(
        1 for r in needs_geocoding
        if r.get("latitude") is not None and r.get("longitude") is not None
    )
    print(
        f"  Forward geocoded {resolved}/{len(needs_geocoding)} records total",
        file=sys.stderr,
    )

    # Filter out records that still lack coordinates
    before = len(records)
    records = [
        r for r in records
        if r.get("latitude") is not None and r.get("longitude") is not None
    ]
    dropped = before - len(records)
    if dropped:
        print(
            f"  Dropped {dropped} records (could not geocode)",
            file=sys.stderr,
        )

    return records
