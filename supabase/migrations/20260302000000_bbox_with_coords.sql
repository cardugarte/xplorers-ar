-- Replace get_campings_in_bbox to return latitude/longitude as separate columns
-- instead of the raw GEOGRAPHY blob (which is unparseable in the JS client).

DROP FUNCTION IF EXISTS get_campings_in_bbox;

CREATE FUNCTION get_campings_in_bbox(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
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
  updated_at TIMESTAMPTZ
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
    c.updated_at
  FROM campings c
  WHERE ST_Intersects(
    c.location,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
  );
$$;
