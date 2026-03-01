"""
OpenStreetMap scraper via Overpass API.
Downloads all tourism=camp_site elements in Argentina.

Tags reference: https://wiki.openstreetmap.org/wiki/Tag:tourism=camp_site
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

from sources.utils import slugify

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

OVERPASS_QUERY = """
[out:json][timeout:120];
area["ISO3166-1"="AR"]->.ar;
(
  node["tourism"="camp_site"](area.ar);
  way["tourism"="camp_site"](area.ar);
  relation["tourism"="camp_site"](area.ar);
);
out body center;
"""

# OSM tag → our amenities key
AMENITY_MAP = {
    "drinking_water": "water",
    "power_supply": "electricity",
    "toilets": "bathrooms",
    "shower": "showers",
    "internet_access": "wifi",
    "internet_access:fee": None,  # skip
    "bbq": "grill",
    "parking": "parking",
    "shop": "store",
    "swimming_pool": "pool",
    "dog": "pets_allowed",
    "restaurant": "restaurant",
}

# Values that mean "yes" in OSM
YES_VALUES = {"yes", "true", "1"}
NO_VALUES = {"no", "false", "0", "none"}



def _parse_bool(value: str | None) -> bool | None:
    """Parse an OSM boolean-ish tag value."""
    if value is None:
        return None
    v = value.lower().strip()
    if v in YES_VALUES:
        return True
    if v in NO_VALUES:
        return False
    # "internet_access" = "wlan" means wifi available
    if v in ("wlan", "wifi", "wired", "terminal"):
        return True
    return None


def _extract_coords(element: dict) -> tuple[float, float] | None:
    """Extract lat/lon from an OSM element (node or way with center)."""
    if "lat" in element and "lon" in element:
        return (element["lat"], element["lon"])
    center = element.get("center")
    if center and "lat" in center and "lon" in center:
        return (center["lat"], center["lon"])
    return None


def _extract_amenities(tags: dict) -> dict:
    """Map OSM tags to our amenities schema."""
    amenities = {}
    for osm_key, our_key in AMENITY_MAP.items():
        if our_key is None:
            continue
        value = _parse_bool(tags.get(osm_key))
        if value is not None:
            amenities[our_key] = value

    # Special cases
    if tags.get("fee") and tags["fee"].lower() in NO_VALUES:
        pass  # free camping, not an amenity but useful info

    # hot_water: rarely tagged in OSM, skip unless explicit
    if tags.get("hot_water"):
        amenities["hot_water"] = _parse_bool(tags["hot_water"])

    return amenities


def _extract_contact(tags: dict) -> dict:
    """Extract contact info from OSM tags."""
    contact = {}

    phone = tags.get("phone") or tags.get("contact:phone")
    if phone:
        contact["phone"] = phone

    email = tags.get("email") or tags.get("contact:email")
    if email:
        contact["email"] = email

    website = tags.get("website") or tags.get("contact:website") or tags.get("url")
    if website:
        contact["website"] = website

    return contact if contact else None


def _infer_type(tags: dict) -> str | None:
    """Infer camping type from OSM tags."""
    operator = (tags.get("operator") or "").lower()
    name = (tags.get("name") or "").lower()
    access = tags.get("access", "")

    if tags.get("backcountry") in ("yes", "true"):
        return "libre"
    if "municipal" in operator or "municipal" in name:
        return "municipal"
    if "nacional" in operator or "parque nacional" in name or "national park" in name:
        return "nacional"
    if tags.get("fee") and tags["fee"].lower() in YES_VALUES:
        return "privado"
    if access == "private":
        return "privado"
    return None


def normalize_element(element: dict) -> dict | None:
    """Normalize a raw OSM element into our camping schema."""
    tags = element.get("tags", {})
    name = tags.get("name")
    if not name:
        return None

    coords = _extract_coords(element)
    if not coords:
        return None

    lat, lon = coords
    slug = slugify(name)
    if not slug:
        return None

    return {
        "name": name.strip(),
        "slug": slug,
        "latitude": lat,
        "longitude": lon,
        "type": _infer_type(tags),
        "amenities": _extract_amenities(tags),
        "contact": _extract_contact(tags),
        "fee": tags.get("fee"),
        "operator": tags.get("operator"),
        "capacity": tags.get("capacity") or tags.get("capacity:tents"),
        "opening_hours": tags.get("opening_hours"),
        "osm_id": f"{element['type']}/{element['id']}",
        "source": "osm",
    }


def download(cache_path: Path | None = None) -> list[dict]:
    """Download all camp_sites from Overpass API."""
    # Use cache if available
    if cache_path and cache_path.exists():
        print(f"Using cached OSM data: {cache_path}", file=sys.stderr)
        with open(cache_path, encoding="utf-8") as f:
            data = json.load(f)
        return data["elements"]

    print("Downloading campings from OpenStreetMap...", file=sys.stderr)
    body = f"data={OVERPASS_QUERY}".encode("utf-8")
    req = Request(
        OVERPASS_URL,
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Xplorers-Scraper/1.0",
        },
    )

    try:
        with urlopen(req, timeout=180) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
    except URLError as e:
        print(f"Overpass API error: {e}", file=sys.stderr)
        raise

    elements = data.get("elements", [])
    print(f"Downloaded {len(elements)} elements", file=sys.stderr)

    # Cache raw response
    if cache_path:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"Cached to {cache_path}", file=sys.stderr)

    return elements


def process(elements: list[dict]) -> list[dict]:
    """Normalize all OSM elements into camping records."""
    campings = []
    seen_slugs: set[str] = set()

    for el in elements:
        camping = normalize_element(el)
        if not camping:
            continue

        # Deduplicate by slug
        slug = camping["slug"]
        if slug in seen_slugs:
            # Append OSM ID to make slug unique
            slug = f"{slug}-{element_short_id(el)}"
            camping["slug"] = slug
        seen_slugs.add(slug)

        campings.append(camping)

    print(f"Normalized {len(campings)} campings (skipped {len(elements) - len(campings)} without name/coords)", file=sys.stderr)
    return campings


def element_short_id(el: dict) -> str:
    """Short unique ID from an OSM element."""
    return f"{el['type'][0]}{el['id']}"
