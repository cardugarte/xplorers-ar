#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Deploying Xplorers Strfry relay..."

cd "$SCRIPT_DIR"

# Ensure strfry-db directory exists for the volume bind (if using local path)
# The Docker named volume handles this automatically, but be explicit.

echo "==> Pulling latest images..."
docker compose pull

echo "==> Starting services..."
docker compose up -d

echo "==> Checking service status..."
docker compose ps

echo ""
echo "==> Relay is up. Verify NIP-11 metadata:"
echo "    curl -H 'Accept: application/nostr+json' https://relay.xplorers.ar"
echo ""
echo "==> WebSocket endpoint: wss://relay.xplorers.ar"
