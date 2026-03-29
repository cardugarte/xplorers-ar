-- Owner claiming: propietarios de campings pueden reclamar su listing.
-- La verificación es manual por admin via Supabase Studio.

CREATE TABLE IF NOT EXISTS owner_claims (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  camping_id   UUID        NOT NULL REFERENCES campings(id) ON DELETE CASCADE,
  claimer_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  evidence     TEXT,
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (camping_id, claimer_id)
);

-- Mark camping as claimed when admin approves
ALTER TABLE campings
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT false;

-- RLS
ALTER TABLE owner_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY IF NOT EXISTS "Users can view own claims"
  ON owner_claims FOR SELECT
  USING (auth.uid() = claimer_id);

-- Users can submit claims (status must be 'pending')
CREATE POLICY IF NOT EXISTS "Users can create claims"
  ON owner_claims FOR INSERT
  WITH CHECK (auth.uid() = claimer_id AND status = 'pending');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_owner_claims_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_owner_claims_updated_at
  BEFORE UPDATE ON owner_claims
  FOR EACH ROW EXECUTE FUNCTION update_owner_claims_updated_at();
