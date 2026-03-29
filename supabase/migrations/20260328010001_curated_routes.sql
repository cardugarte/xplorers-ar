-- Rutas turísticas curadas: itinerarios predefinidos que conectan campings.

CREATE TABLE IF NOT EXISTS curated_routes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  description   TEXT,
  region        TEXT,
  difficulty    TEXT        CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  duration_days INTEGER,
  camping_ids   UUID[]      NOT NULL DEFAULT '{}',
  waypoints     JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: lectura pública
ALTER TABLE curated_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public read access"
  ON curated_routes FOR SELECT
  USING (true);

-- RPC: devuelve la ruta + sus campings asociados (preservando orden)
CREATE OR REPLACE FUNCTION get_route_with_campings(route_id UUID)
RETURNS JSON
LANGUAGE sql STABLE
AS $$
  SELECT json_build_object(
    'route', row_to_json(r),
    'campings', (
      SELECT json_agg(c ORDER BY array_position(r.camping_ids, c.id))
      FROM campings c
      WHERE c.id = ANY(r.camping_ids)
    )
  )
  FROM curated_routes r
  WHERE r.id = route_id;
$$;
