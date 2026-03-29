-- Analytics: camping_views table + get_camping_analytics RPC
-- Tracks per-view events and aggregates stats for owner dashboards.

-- ─── camping_views ────────────────────────────────────────────────────────────

CREATE TABLE camping_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  camping_id UUID        NOT NULL REFERENCES campings(id) ON DELETE CASCADE,
  viewer_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX camping_views_camping_id_idx ON camping_views (camping_id);
CREATE INDEX camping_views_viewed_at_idx  ON camping_views (viewed_at);

ALTER TABLE camping_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anonymous or authenticated)
CREATE POLICY "Anyone can record a view"
  ON camping_views FOR INSERT
  WITH CHECK (true);

-- Only the camping owner can read view data for their campings
CREATE POLICY "Owners can read own camping views"
  ON camping_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campings
      WHERE campings.id = camping_views.camping_id
        AND campings.owner_npub = (
          SELECT raw_user_meta_data->>'npub'
          FROM auth.users
          WHERE id = auth.uid()
        )
    )
  );

-- ─── get_camping_analytics RPC ────────────────────────────────────────────────
-- Returns aggregated analytics for a given camping over the last N days.
-- Result shape:
--   total_views        INTEGER
--   total_favorites    INTEGER
--   total_reservations INTEGER  (placeholder — reservations table is Fase 3)
--   views_by_day       JSONB[]  [{date, count}]

CREATE OR REPLACE FUNCTION get_camping_analytics(
  p_camping_id UUID,
  p_days       INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_since        TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
  v_total_views  INTEGER;
  v_total_favs   INTEGER;
  v_views_by_day JSON;
BEGIN
  -- Total views in period
  SELECT COUNT(*)::INTEGER
  INTO v_total_views
  FROM camping_views
  WHERE camping_id = p_camping_id
    AND viewed_at >= v_since;

  -- Total favorites (favorites table added in a future migration; graceful fallback)
  BEGIN
    EXECUTE format(
      'SELECT COUNT(*)::INTEGER FROM favorites WHERE camping_id = %L AND created_at >= %L',
      p_camping_id, v_since
    ) INTO v_total_favs;
  EXCEPTION WHEN undefined_table THEN
    v_total_favs := 0;
  END;

  -- Daily views breakdown
  SELECT json_agg(day_row ORDER BY day_row->>'date')
  INTO v_views_by_day
  FROM (
    SELECT json_build_object(
      'date',  to_char(date_trunc('day', viewed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD'),
      'count', COUNT(*)::INTEGER
    ) AS day_row
    FROM camping_views
    WHERE camping_id = p_camping_id
      AND viewed_at >= v_since
    GROUP BY date_trunc('day', viewed_at AT TIME ZONE 'UTC')
  ) sub;

  RETURN json_build_object(
    'total_views',        COALESCE(v_total_views, 0),
    'total_favorites',    COALESCE(v_total_favs, 0),
    'total_reservations', 0,
    'views_by_day',       COALESCE(v_views_by_day, '[]'::JSON)
  );
END;
$$;
