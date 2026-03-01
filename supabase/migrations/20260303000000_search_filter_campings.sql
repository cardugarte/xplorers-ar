-- Combined search + filter RPC for the Explore screen.
-- Leverages existing indexes: trigram (name), GIN (amenities), B-tree (province, type).
-- Returns full row with latitude/longitude extracted (same pattern as get_campings_in_bbox).

CREATE OR REPLACE FUNCTION search_and_filter_campings(
  query TEXT DEFAULT '',
  provinces TEXT[] DEFAULT '{}',
  types TEXT[] DEFAULT '{}',
  required_amenities TEXT[] DEFAULT '{}',
  lim INTEGER DEFAULT 50,
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
  similarity REAL
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
    END AS similarity
  FROM campings c
  WHERE
    -- Trigram filter: only when query is non-empty
    (query = '' OR c.name % query)
    -- Province filter: only when array is non-empty
    AND (provinces = '{}' OR c.province = ANY(provinces))
    -- Type filter: only when array is non-empty
    AND (types = '{}' OR c.type = ANY(types))
    -- Amenities filter: all required amenities must be true
    AND (required_amenities = '{}' OR c.amenities @> (
      SELECT jsonb_object_agg(key, true)
      FROM unnest(required_amenities) AS key
    ))
  ORDER BY
    CASE WHEN query <> '' THEN similarity(c.name, query) END DESC NULLS LAST,
    c.name ASC
  LIMIT lim
  OFFSET off_set;
$$;
