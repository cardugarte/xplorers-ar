"""
Mendoza tourism scraper — datosabiertos.mendoza.gov.ar
Downloads the "Alojamientos Turísticos" CSV and filters for CAMPING entries.

Source: https://datosabiertos.mendoza.gov.ar/dataset/alojamientos-turisticos-habilitados
Format: CSV with `;` delimiter, latin-1 encoding
"""

from __future__ import annotations

import csv
import io
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

from sources.utils import slugify

CSV_URL = (
    "https://datosabiertos.mendoza.gov.ar/dataset/"
    "ed1b2a6b-8762-4733-8b34-614acd17f729/resource/"
    "5c283e5e-f286-49f9-8e6d-3e2873eb0cb1/download/"
    "alojamientos-julio-2019.csv"
)

# CSV columns (0-indexed):
# 0: RUBRO, 1: NOMBRE FANTASIA, 2: DIRECCION, 3: Nº,
# 4: LOCALIDAD, 5: DEPARTAMENTO, 6: TELEFONOS,
# 7: CLASE, 8: CATEGORIA, 9: ESTADO, 10: HABIT.,
# 11: PLAZAS, 12: TITULAR, 13: E-MAIL, 14: HAB.PARA DISCAPACITADOS


def _download_csv(cache_path: Path | None) -> str:
    """Download CSV and return as UTF-8 string."""
    if cache_path and cache_path.exists():
        print(f"  Using cached Mendoza data: {cache_path}", file=sys.stderr)
        with open(cache_path, encoding="utf-8") as f:
            return f.read()

    print("  Downloading Mendoza alojamientos CSV...", file=sys.stderr)
    req = Request(CSV_URL, headers={"User-Agent": "Xplorers-Scraper/1.0"})
    try:
        with urlopen(req, timeout=30) as response:
            raw = response.read()
    except URLError as e:
        print(f"  Mendoza download error: {e}", file=sys.stderr)
        return ""

    # Try latin-1 first (known encoding), fallback to utf-8
    for encoding in ("latin-1", "utf-8"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        print("  Could not decode Mendoza CSV", file=sys.stderr)
        return ""

    if cache_path:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"  Cached to {cache_path}", file=sys.stderr)

    return text


def _parse_contact(phone: str, email: str) -> dict | None:
    """Build contact dict from phone and email fields."""
    contact = {}
    phone = phone.strip()
    if phone:
        contact["phone"] = phone
    email = email.strip()
    if email:
        # Some entries have "email    www.site.com" in the email field
        parts = email.split()
        for part in parts:
            if "@" in part:
                contact["email"] = part
            elif part.startswith(("www.", "http")):
                contact["website"] = part
    return contact if contact else None


def _infer_type(nombre: str, titular: str) -> str | None:
    """Infer camping type from name and owner."""
    nombre_lower = nombre.lower()
    titular_lower = titular.lower()
    if "municipal" in nombre_lower or "municipalidad" in titular_lower:
        return "municipal"
    if "nacional" in nombre_lower:
        return "nacional"
    return "privado"


def scrape(cache_path: Path | None = None) -> list[dict]:
    """
    Scrape Mendoza campings from the open data CSV.
    Returns normalized records (without lat/lon — needs forward geocoding).
    """
    text = _download_csv(cache_path)
    if not text:
        return []

    reader = csv.reader(io.StringIO(text), delimiter=";")

    # Skip header
    try:
        next(reader)
    except StopIteration:
        return []

    campings = []
    seen_slugs: set[str] = set()

    for row in reader:
        if len(row) < 14:
            continue

        rubro = row[0].strip().upper()
        if "CAMPING" not in rubro:
            continue

        estado = row[9].strip().upper()
        if estado not in ("INSCRIPTO", "E/T"):
            continue

        nombre = row[1].strip()
        if not nombre:
            continue

        slug = slugify(nombre)
        if not slug:
            continue

        # Handle duplicate slugs
        if slug in seen_slugs:
            dept = slugify(row[5].strip())
            slug = f"{slug}-{dept}" if dept else f"{slug}-mza"
        seen_slugs.add(slug)

        direccion = row[2].strip()
        numero = row[3].strip()
        if numero and numero not in ("S/N", "____", ""):
            direccion = f"{direccion} {numero}"

        localidad = row[4].strip()
        departamento = row[5].strip()
        telefono = row[6].strip()
        email = row[13].strip() if len(row) > 13 else ""
        titular = row[12].strip() if len(row) > 12 else ""

        campings.append({
            "name": nombre,
            "slug": slug,
            "latitude": None,
            "longitude": None,
            "address": direccion if direccion else None,
            "locality": localidad if localidad else None,
            "department": departamento if departamento else None,
            "province": "Mendoza",
            "type": _infer_type(nombre, titular),
            "amenities": {},
            "contact": _parse_contact(telefono, email),
            "source": "scraped",
        })

    print(f"  Mendoza: {len(campings)} campings found", file=sys.stderr)
    return campings
