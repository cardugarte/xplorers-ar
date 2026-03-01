"""
Neuquén tourism scraper — turismo.neuquen.gob.ar
Scrapes camping entries from the "Buscar Alojamientos" page using
Search & Filter Pro taxonomy URLs with pagination.

Source: https://turismo.neuquen.gob.ar/buscar-alojamientos/
Format: WordPress Elementor + Search & Filter Pro, server-rendered HTML
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

from sources.utils import slugify

BASE_URL = "https://turismo.neuquen.gob.ar/buscar-alojamientos/"

# Camping categories available in the taxonomy filter
CAMPING_CATEGORIES = [
    "camping-organizado",
    "camping-agreste",
    "camping-organizado-glamping",
]

MAX_PAGES = 10  # safety limit


class _LoopItemParser(HTMLParser):
    """Extract camping entries from Elementor loop HTML."""

    def __init__(self):
        super().__init__()
        self.entries: list[dict] = []
        self._current_entry: dict | None = None
        self._current_text_parts: list[str] = []
        self._in_heading = False
        self._in_content = False
        self._content_depth = 0
        self._text_blocks: list[str] = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get("class", "")

        # Detect loop item container
        if "e-loop-item" in cls and "e-loop-item-" in cls:
            # Save previous entry
            if self._current_entry:
                self._finalize_entry()

            self._current_entry = {"classes": cls}
            self._text_blocks = []

        # Detect heading: <h1 class="elementor-heading-title ...">
        if tag in ("h1", "h2", "h3", "h4") and "elementor-heading-title" in cls:
            self._in_heading = True
            self._current_text_parts = []

        # Detect content widget container
        if "theme-post-content" in cls:
            self._in_content = True
            self._current_text_parts = []
            self._content_depth = 0

        # Track div nesting inside content
        if self._in_content and tag == "div":
            self._content_depth += 1

    def handle_endtag(self, tag):
        if self._in_heading and tag in ("h1", "h2", "h3", "h4"):
            text = "".join(self._current_text_parts).strip()
            if text and self._current_entry is not None:
                self._current_entry["name"] = text
            self._in_heading = False

        if self._in_content and tag == "div":
            self._content_depth -= 1
            if self._content_depth < 0:
                self._in_content = False

    def handle_data(self, data):
        if self._in_heading:
            self._current_text_parts.append(data)
        elif self._in_content and self._current_entry is not None:
            stripped = data.strip()
            if stripped:
                self._text_blocks.append(stripped)

    def _finalize_entry(self):
        if not self._current_entry or "name" not in self._current_entry:
            return

        entry = self._current_entry

        # Extract locality from CSS classes: alo-localidades-xxx-code
        locality = None
        cls = entry.get("classes", "")
        loc_match = re.search(r"alo-localidades-([\w-]+?)(?:-\d{3,5})?(?:\s|$)", cls)
        if loc_match:
            # Convert slug back to locality name
            locality = loc_match.group(1).replace("-", " ").title()

        # Extract category from CSS classes
        category = None
        cat_match = re.search(r"alo-categoria-([\w-]+)", cls)
        if cat_match:
            category = cat_match.group(1).replace("-", " ").title()

        # Parse text blocks: typically [category, address, phone, ...]
        address = None
        phone = None
        for block in self._text_blocks:
            # Skip category labels
            if block.lower().startswith("camping"):
                continue
            # Phone pattern
            if re.match(r"^[\d\s\-\(\)/+]+$", block) and len(block) >= 6:
                phone = block
            # Otherwise likely address
            elif not address and len(block) > 5:
                # Clean HTML entities
                address = block.replace("\u2013", "-").replace("\u2014", "-")

        entry["locality"] = locality
        entry["category"] = category
        entry["address"] = address
        entry["phone"] = phone

        self.entries.append(entry)

    def close(self):
        if self._current_entry:
            self._finalize_entry()
        super().close()


def _fetch_page(category: str, page: int) -> str:
    """Fetch a single page of results for a camping category."""
    url = f"{BASE_URL}?_sft_alo-categoria={category}&sf_paged={page}"
    req = Request(url, headers={"User-Agent": "Xplorers-Scraper/1.0"})
    try:
        with urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8")
    except URLError as e:
        print(f"  Neuquén fetch error (page {page}): {e}", file=sys.stderr)
        return ""


def _count_loop_items(html: str) -> int:
    """Count loop items in HTML response."""
    return len(re.findall(r"e-loop-item e-loop-item-\d+", html))


def scrape(cache_path: Path | None = None) -> list[dict]:
    """
    Scrape Neuquén campings from the tourism site.
    Returns normalized records (without lat/lon — needs forward geocoding).
    """
    # Check cache
    if cache_path and cache_path.exists():
        print(f"  Using cached Neuquén data: {cache_path}", file=sys.stderr)
        with open(cache_path, encoding="utf-8") as f:
            return json.load(f)

    all_entries = []

    for category in CAMPING_CATEGORIES:
        print(f"  Fetching Neuquén category: {category}", file=sys.stderr)

        for page in range(1, MAX_PAGES + 1):
            html = _fetch_page(category, page)
            if not html:
                break

            item_count = _count_loop_items(html)
            if item_count == 0:
                break

            parser = _LoopItemParser()
            parser.feed(html)
            parser.close()

            print(
                f"    Page {page}: {len(parser.entries)} entries",
                file=sys.stderr,
            )
            all_entries.extend(parser.entries)

            # If fewer than 10 items, this is the last page
            if item_count < 10:
                break

    # Normalize entries
    campings = []
    seen_slugs: set[str] = set()

    for entry in all_entries:
        name = entry.get("name", "").strip()
        if not name:
            continue

        # Ensure name includes "Camping" prefix
        if not name.lower().startswith("camping"):
            name = f"Camping {name}"

        slug = slugify(name)
        if not slug:
            continue

        if slug in seen_slugs:
            loc_slug = slugify(entry.get("locality") or "")
            slug = f"{slug}-{loc_slug}" if loc_slug else f"{slug}-nqn"
        seen_slugs.add(slug)

        contact = None
        phone = entry.get("phone")
        if phone:
            contact = {"phone": phone}

        campings.append({
            "name": name,
            "slug": slug,
            "latitude": None,
            "longitude": None,
            "address": entry.get("address"),
            "locality": entry.get("locality"),
            "province": "Neuquén",
            "type": _infer_type(name, entry.get("category", "")),
            "amenities": {},
            "contact": contact,
            "source": "scraped",
        })

    # Cache parsed results
    if cache_path and campings:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(campings, f, ensure_ascii=False, indent=2)
        print(f"  Cached to {cache_path}", file=sys.stderr)

    print(f"  Neuquén: {len(campings)} campings found", file=sys.stderr)
    return campings


def _infer_type(name: str, category: str) -> str | None:
    """Infer camping type from name and category."""
    name_lower = name.lower()
    if "municipal" in name_lower:
        return "municipal"
    if "agreste" in category.lower():
        return "libre"
    return "privado"
