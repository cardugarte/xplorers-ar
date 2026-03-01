-- Evolve search_and_filter_campings: add sort by name/distance, pagination default 20.
-- Signature changes (new params), so we DROP + CREATE.

DROP FUNCTION IF EXISTS search_and_filter_campings(TEXT, TEXT[], TEXT[], TEXT[], INTEGER, INTEGER);

CREATE FUNCTION search_and_filter_campings(
  query TEXT DEFAULT '',
  provinces TEXT[] DEFAULT '{}',
  types TEXT[] DEFAULT '{}',
  required_amenities TEXT[] DEFAULT '{}',
  sort_by TEXT DEFAULT 'name',
  user_lat DOUBLE PRECISION DEFAULT NULL,
  user_lng DOUBLE PRECISION DEFAULT NULL,
  lim INTEGER DEFAULT 20,
  off_set INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  province TEXT,
  geohash TEXT,
  type TEXT,
  amenities JSONB,
  prices JSONB,
  contact JSONB,
  photos TEXT[],
  source TEXT,
  verified BOOLEAN,
  owner_npub TEXT,
  owner_lightning_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity REAL,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    ST_Y(c.location::geometry) AS latitude,
    ST_X(c.location::geometry) AS longitude,
    c.province,
    c.geohash,
    c.type,
    c.amenities,
    c.prices,
    c.contact,
    c.photos,
    c.source,
    c.verified,
    c.owner_npub,
    c.owner_lightning_address,
    c.created_at,
    c.updated_at,
    CASE
      WHEN query <> '' THEN similarity(c.name, query)
      ELSE 1.0
    END AS similarity,
    CASE
      WHEN sort_by = 'distance' AND user_lat IS NOT NULL AND user_lng IS NOT NULL
        THEN ST_Distance(
          c.location,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000.0
      ELSE NULL
    END AS distance_km
  FROM campings c
  WHERE
    (query = '' OR c.name % query)
    AND (provinces = '{}' OR c.province = ANY(provinces))
    AND (types = '{}' OR c.type = ANY(types))
    AND (required_amenities = '{}' OR c.amenities @> (
      SELECT jsonb_object_agg(key, true)
      FROM unnest(required_amenities) AS key
    ))
  ORDER BY
    CASE WHEN query <> '' THEN similarity(c.name, query) END DESC NULLS LAST,
    CASE
      WHEN sort_by = 'distance' AND user_lat IS NOT NULL AND user_lng IS NOT NULL
        THEN ST_Distance(
          c.location,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        )
    END ASC NULLS LAST,
    c.name ASC
  LIMIT lim
  OFFSET off_set;
$$;
