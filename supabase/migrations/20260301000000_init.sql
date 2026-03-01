-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_trgm for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Campings table
CREATE TABLE campings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  province TEXT NOT NULL,
  geohash TEXT NOT NULL,
  type TEXT CHECK (type IN ('municipal', 'nacional', 'privado', 'libre')),
  amenities JSONB NOT NULL DEFAULT '{}',
  prices JSONB,
  contact JSONB,
  photos TEXT[] DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('sinta', 'scraped', 'community')),
  verified BOOLEAN DEFAULT false,
  owner_npub TEXT,
  owner_lightning_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for geo queries
CREATE INDEX idx_campings_location ON campings USING GIST(location);

-- GIN index for amenities JSONB queries
CREATE INDEX idx_campings_amenities ON campings USING GIN(amenities);

-- Trigram index for fuzzy name search
CREATE INDEX idx_campings_name_trgm ON campings USING GIN(name gin_trgm_ops);

-- B-tree indexes
CREATE INDEX idx_campings_province ON campings(province);
CREATE INDEX idx_campings_geohash ON campings(geohash);
CREATE INDEX idx_campings_source ON campings(source);
CREATE INDEX idx_campings_verified ON campings(verified);

-- Function: Get campings near a point
CREATE OR REPLACE FUNCTION get_campings_near(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  lim INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  location GEOGRAPHY,
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
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.*,
    ST_Distance(
      c.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000.0 AS distance_km
  FROM campings c
  WHERE ST_DWithin(
    c.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km
  LIMIT lim;
$$;

-- Function: Get campings in bounding box
CREATE OR REPLACE FUNCTION get_campings_in_bbox(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS SETOF campings
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM campings
  WHERE ST_Intersects(
    location,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
  );
$$;

-- Function: Search campings by name (fuzzy)
CREATE OR REPLACE FUNCTION search_campings(
  query TEXT,
  lim INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  province TEXT,
  similarity REAL
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    c.province,
    similarity(c.name, query) AS similarity
  FROM campings c
  WHERE c.name % query
  ORDER BY similarity DESC
  LIMIT lim;
$$;

-- Favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camping_id UUID NOT NULL REFERENCES campings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, camping_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Error reports table
CREATE TABLE error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camping_id UUID NOT NULL REFERENCES campings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wrong_location', 'closed', 'wrong_info', 'duplicate', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'fixed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_reports_camping ON error_reports(camping_id);
CREATE INDEX idx_error_reports_status ON error_reports(status);

-- Row Level Security
ALTER TABLE campings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Campings: everyone can read, only service role can write
CREATE POLICY "campings_select" ON campings FOR SELECT USING (true);

-- Favorites: users manage their own
CREATE POLICY "favorites_select" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Error reports: anyone can create, only service role can update
CREATE POLICY "error_reports_insert" ON error_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "error_reports_select_own" ON error_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER campings_updated_at
  BEFORE UPDATE ON campings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
