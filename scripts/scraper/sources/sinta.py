"""
SINTA Scraper — datos.yvera.tur.ar
===================================
The PUNA (Padrón Único Nacional de Alojamiento) dataset contains individual
accommodation establishments by province, including campings.

STATUS: The PUNA dataset requires authentication as of March 2026.
        The CKAN API returns "Authorization Error" for anonymous access.
        This module is kept as a scaffold for when/if access is granted
        or we obtain API credentials.

Alternative: The pipeline uses OpenStreetMap (Overpass API) as the primary
data source, which provides ~2400 campings with coordinates.

SINTA portal: https://datos.yvera.tur.ar
PUNA dataset: https://datos.yvera.tur.ar/dataset/padron-unico-nacional-alojamiento
"""

import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

SINTA_CKAN_URL = "https://datos.yvera.tur.ar/api/3/action"
PUNA_DATASET_ID = "padron-unico-nacional-alojamiento"


def check_access() -> bool:
    """Check if PUNA dataset is publicly accessible."""
    url = f"{SINTA_CKAN_URL}/package_show?id={PUNA_DATASET_ID}"
    req = Request(url, headers={"User-Agent": "Xplorers-Scraper/1.0"})
    try:
        with urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("success", False)
    except URLError:
        return False


def download() -> list[dict]:
    """
    Download PUNA camping data.
    Returns empty list if dataset is not accessible.
    """
    if not check_access():
        print(
            "SINTA/PUNA dataset not accessible (authentication required)",
            file=sys.stderr,
        )
        return []

    # TODO: When access is available, implement:
    # 1. Fetch dataset resources list
    # 2. Find CSV/JSON resource with individual establishments
    # 3. Filter by tipo = 'camping' or classification
    # 4. Normalize to our schema
    return []
