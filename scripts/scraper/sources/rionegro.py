"""
Río Negro tourism scraper — turismo.rionegro.gov.ar
Parses the "Alojamiento Habilitado" page for camping entries.

Source: https://turismo.rionegro.gov.ar/actividad/alojamiento-habilitado_541
Format: Server-rendered HTML, organized by region → locality → entries
"""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

from sources.utils import slugify

PAGE_URL = "https://turismo.rionegro.gov.ar/actividad/alojamiento-habilitado_541"


class _TextExtractor(HTMLParser):
    """Strip HTML tags and collect text with minimal structure markers."""

    def __init__(self):
        super().__init__()
        self.lines: list[str] = []
        self._current: list[str] = []
        self._in_strong = False

    def handle_starttag(self, tag, attrs):
        if tag == "strong":
            self._in_strong = True
        elif tag == "br":
            text = "".join(self._current).strip()
            if text:
                self.lines.append(text)
            self._current = []

    def handle_endtag(self, tag):
        if tag == "strong":
            self._in_strong = False

    def handle_data(self, data):
        self._current.append(data)

    def handle_entityref(self, name):
        entities = {
            "nbsp": " ", "amp": "&", "lt": "<", "gt": ">",
            "eacute": "é", "iacute": "í", "oacute": "ó",
            "uacute": "ú", "ntilde": "ñ", "Ntilde": "Ñ",
            "uuml": "ü", "aacute": "á",
        }
        self._current.append(entities.get(name, f"&{name};"))

    def close(self):
        text = "".join(self._current).strip()
        if text:
            self.lines.append(text)
        super().close()


def _download_html(cache_path: Path | None) -> str:
    """Download HTML and return as string."""
    if cache_path and cache_path.exists():
        print(f"  Using cached Río Negro data: {cache_path}", file=sys.stderr)
        with open(cache_path, encoding="utf-8") as f:
            return f.read()

    print("  Downloading Río Negro alojamientos page...", file=sys.stderr)
    req = Request(PAGE_URL, headers={"User-Agent": "Xplorers-Scraper/1.0"})
    try:
        with urlopen(req, timeout=30) as response:
            html = response.read().decode("utf-8")
    except URLError as e:
        print(f"  Río Negro download error: {e}", file=sys.stderr)
        return ""

    if cache_path:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  Cached to {cache_path}", file=sys.stderr)

    return html


# Regex to detect locality headers like "// Las Grutas //" or "// Río Colorado //"
_LOCALITY_RE = re.compile(r"^//\s*(.+?)\s*//$")

# Regex to detect region headers like "│ C O R D I L L E R A │"
_REGION_RE = re.compile(r"│\s*([A-ZÁÉÍÓÚÑ\s]+?)\s*│")


def _parse_camping_entry(text: str, locality: str) -> dict | None:
    """Parse a single ► entry that contains 'Camping'."""
    # Remove leading ► and whitespace, trailing dots/spaces
    text = re.sub(r"^►\s*", "", text).strip()
    text = text.rstrip(". ")
    if not text:
        return None

    # Common patterns:
    # "Name. Camping. Address"
    # "Name. Camping"
    # "Camping Municipal Name. Address"
    # "Name Camping - Address"

    name = None
    address = None

    # Pattern: "Name. Camping. Address" or "Name. Camping"
    match = re.match(r"^(.+?)\.\s*[Cc]amping\s*(?:[.\-]\s*(.+))?$", text)
    if match:
        name = match.group(1).strip()
        address = match.group(2).strip() if match.group(2) else None
    else:
        # Pattern: "Camping Name. Address" or "Camping Name"
        match = re.match(r"^[Cc]amping\s+(.+?)(?:\.\s*(.+))?$", text)
        if match:
            name = match.group(1).strip()
            address = match.group(2).strip() if match.group(2) else None
        else:
            # Pattern: "Name Camping - Address"
            match = re.match(r"^(.+?)\s+[Cc]amping\s*[-–]\s*(.+)$", text)
            if match:
                name = match.group(1).strip()
                address = match.group(2).strip()
            else:
                # Fallback: strip "Cat/ Dat" suffixes and use full text
                name = re.sub(r"\s*Cat/\s*Dat\s*$", "", text).strip()

    if not name:
        return None

    # Remove trailing "Camping" if present (e.g. "Tunquelén Camping")
    name = re.sub(r"\s+[Cc]amping\s*$", "", name)

    # Prefix "Camping" to name if not already present
    if not name.lower().startswith("camping"):
        name = f"Camping {name}"

    # Clean up trailing dots/spaces
    name = name.rstrip(". ")
    if address:
        address = address.rstrip(". ")

    return {
        "name": name,
        "address": address,
        "locality": locality,
    }


def scrape(cache_path: Path | None = None) -> list[dict]:
    """
    Scrape Río Negro campings from the tourism page.
    Returns normalized records (without lat/lon — needs forward geocoding).
    """
    html = _download_html(cache_path)
    if not html:
        return []

    # Extract text lines from HTML
    parser = _TextExtractor()
    parser.feed(html)
    parser.close()
    lines = parser.lines

    campings = []
    seen_slugs: set[str] = set()
    current_locality = None
    current_region = None

    for line in lines:
        # Check for region header
        region_match = _REGION_RE.search(line)
        if region_match:
            current_region = region_match.group(1).replace(" ", "").strip().title()
            continue

        # Check for locality header
        locality_match = _LOCALITY_RE.match(line)
        if locality_match:
            current_locality = locality_match.group(1).strip()
            continue

        # Check for camping entry (► line containing "camping")
        if not line.startswith("►"):
            continue
        if "camping" not in line.lower():
            continue
        if not current_locality:
            continue

        entry = _parse_camping_entry(line, current_locality)
        if not entry or not entry["name"]:
            continue

        slug = slugify(entry["name"])
        if not slug:
            continue

        # Handle duplicate slugs
        if slug in seen_slugs:
            loc_slug = slugify(current_locality)
            slug = f"{slug}-{loc_slug}" if loc_slug else f"{slug}-rn"
        seen_slugs.add(slug)

        campings.append({
            "name": entry["name"],
            "slug": slug,
            "latitude": None,
            "longitude": None,
            "address": entry.get("address"),
            "locality": current_locality,
            "province": "Río Negro",
            "type": "municipal" if "municipal" in entry["name"].lower() else None,
            "amenities": {},
            "contact": None,
            "source": "scraped",
        })

    print(f"  Río Negro: {len(campings)} campings found", file=sys.stderr)
    return campings
