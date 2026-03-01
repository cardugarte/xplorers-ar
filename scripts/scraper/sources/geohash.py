"""Geohash encoder — pure Python, zero dependencies."""

_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"


def encode(lat: float, lon: float, precision: int = 5) -> str:
    """Encode lat/lon to a geohash string of given precision."""
    lat_range = (-90.0, 90.0)
    lon_range = (-180.0, 180.0)
    bits = 0
    hash_value = 0
    result = []
    is_lon = True

    while len(result) < precision:
        if is_lon:
            mid = (lon_range[0] + lon_range[1]) / 2
            if lon >= mid:
                hash_value = (hash_value << 1) | 1
                lon_range = (mid, lon_range[1])
            else:
                hash_value = hash_value << 1
                lon_range = (lon_range[0], mid)
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if lat >= mid:
                hash_value = (hash_value << 1) | 1
                lat_range = (mid, lat_range[1])
            else:
                hash_value = hash_value << 1
                lat_range = (lat_range[0], mid)

        is_lon = not is_lon
        bits += 1

        if bits == 5:
            result.append(_BASE32[hash_value])
            bits = 0
            hash_value = 0

    return "".join(result)
