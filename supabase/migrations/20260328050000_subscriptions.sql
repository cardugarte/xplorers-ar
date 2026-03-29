-- Owner subscriptions for camping Pro/Premium plans
-- Paid via Lightning (NWC). Cron-based renewal handled by Edge Function.

CREATE TABLE owner_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camping_id UUID NOT NULL REFERENCES campings(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'premium')),
  amount_sats INTEGER NOT NULL DEFAULT 0,
  payment_hash TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled', 'past_due')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, camping_id)
);

-- Index for cron job: find subscriptions due for renewal
CREATE INDEX idx_owner_subscriptions_expiry
  ON owner_subscriptions (status, expires_at)
  WHERE status = 'active';

-- RLS
ALTER TABLE owner_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can read/insert/update their own subscriptions
CREATE POLICY "Owners manage own subscriptions"
  ON owner_subscriptions FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Anyone can read active subscriptions (to check Pro badge)
CREATE POLICY "Public can read active subscriptions"
  ON owner_subscriptions FOR SELECT
  USING (status IN ('active', 'past_due'));
