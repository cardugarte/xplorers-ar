-- Tabla de reservas de camping
-- Fase 3: Lightning Payments
-- Vinculada a auth.users — la auth real llega con #13

CREATE TABLE IF NOT EXISTS reservations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  camping_id   UUID        NOT NULL REFERENCES campings(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camper_npub  TEXT,
  check_in     DATE        NOT NULL,
  check_out    DATE        NOT NULL,
  guests       INTEGER     NOT NULL DEFAULT 1
                           CHECK (guests > 0 AND guests <= 20),
  notes        TEXT,
  total_sats   BIGINT,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN (
                             'pending',
                             'payment_requested',
                             'paid',
                             'confirmed',
                             'cancelled',
                             'expired'
                           )),
  payment_hash TEXT,
  preimage     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_out_after_check_in CHECK (check_out > check_in)
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias reservas
CREATE POLICY IF NOT EXISTS "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden crear reservas propias
CREATE POLICY IF NOT EXISTS "Users can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar sus reservas en estado pending o payment_requested
CREATE POLICY IF NOT EXISTS "Users can update own pending reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'payment_requested'));

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_reservations_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS reservations_user_id_idx ON reservations (user_id);
CREATE INDEX IF NOT EXISTS reservations_camping_id_idx ON reservations (camping_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations (status);
