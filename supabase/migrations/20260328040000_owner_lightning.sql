-- RPC: set_owner_lightning_address
-- Allows a camping owner to update their Lightning Address.
-- Safety check: owner_npub must be set on the camping before allowing this update.
CREATE OR REPLACE FUNCTION set_owner_lightning_address(
  camping_id UUID,
  lud16 TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the camping exists and has an owner_npub set
  IF NOT EXISTS (
    SELECT 1 FROM campings
    WHERE id = camping_id
      AND owner_npub IS NOT NULL
      AND owner_npub <> ''
  ) THEN
    RAISE EXCEPTION 'camping_not_claimed: el camping no tiene un owner_npub registrado';
  END IF;

  UPDATE campings
  SET owner_lightning_address = lud16
  WHERE id = camping_id;
END;
$$;
