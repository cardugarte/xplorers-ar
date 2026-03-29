# Complete All Phases — Execution Design

**Date:** 2026-03-28
**Scope:** All 30 open issues (#11-#40) across Fase 1, 2, and 3
**Strategy:** Maximum parallelism via isolated git worktrees, wave-based execution with code review checkpoints

## Dependency Graph

```
Wave 0 — Independent (11 issues, all start immediately)
├── WS-OFFLINE:   #11 Offline cache (expo-sqlite) + #12 Offline maps (Mapbox)
├── WS-AUTH:      #13 Auth básico (Supabase)
├── WS-EAS:       #15 EAS Build + Update
├── WS-NDK:       #17 NDK Mobile (CRITICAL PATH — blocks 12 issues)
├── WS-GPS:       #21 GPS proximity verification
├── WS-OWNER:     #27 Owner claiming + #28 Rutas curadas
├── WS-NOTIF:     #29 Push notifications
├── WS-RELAY:     #30 Relay Strfry (config/Docker only)
└── WS-BREEZ:     #36 Breez SDK Liquid

Wave 1 — Unlocked after Wave 0 (5 issues)
├── WS-FAV:       #14 Favoritos ← needs #13
├── WS-SUBMIT:    #16 Store submission ← needs #15
├── WS-RESERVA:   #32 Reservas flow ← needs #13
├── WS-OWNLN:     #35 Owner Lightning address ← needs #27
└── WS-ANALYTICS: #40 Dashboard analytics ← needs #27

Wave 2 — Unlocked after NDK (#17) (10 issues)
├── WS-IDENTITY:  #18 Perfil Nostr + #26 NIP-46
├── WS-SOCIAL:    #19 Venues + #20 Reviews + #22 Check-ins + #23 Feed
├── WS-BADGES:    #24 Badges NIP-58
├── WS-NWC:       #31 NWC + #34 Zaps
└── WS-UGC:       #39 Rutas UGC

Wave 3 — Deep dependencies (4 issues)
├── WS-PROFILE:   #25 Perfil con badges ← needs #24
├── WS-PAYMENTS:  #33 Pago P2P + #37 HODL + #38 Suscripción ← need #31
```

## Workstream Design

### Principle: Domain Isolation

The Screaming Architecture makes this viable. Each workstream owns files within its bounded context. Shared files (_layout.tsx, package.json, app.json, tailwind.config.js) are modified ONLY by the main orchestrator after merging, never by parallel agents.

### File Ownership Map

| Workstream | Owns (exclusive) | Touches (coordinated) |
|------------|-------------------|-----------------------|
| WS-OFFLINE | src/infrastructure/tanstack/onlineManager.ts, focusManager.ts; src/domains/camping/hooks.ts (sync hook only) | app/_layout.tsx (import) |
| WS-AUTH | src/domains/identity/hooks.ts, app/(auth)/*.tsx, src/infrastructure/supabase/client.ts (AppState listener) | app/_layout.tsx (auth provider) |
| WS-NDK | src/infrastructure/nostr/ndk.ts, src/domains/identity/store.ts | app/_layout.tsx (NDK provider), package.json |
| WS-EAS | eas.json, app.json (runtimeVersion/updates only) | — |
| WS-FAV | src/domains/camping/favorites.ts, src/domains/camping/components/FavoriteButton.tsx | CampingCard, CampingDetail (add button) |
| WS-SOCIAL | src/domains/social/* (except badges/), app/(tabs)/social.tsx | — |
| WS-BADGES | src/domains/social/badges/* (new subdirectory) | — |
| WS-PROFILE | app/(tabs)/profile.tsx, src/domains/identity/components/* | — |
| WS-NWC | src/infrastructure/wallet/nwc.ts, src/domains/payments/hooks.ts | — |
| WS-PAYMENTS | src/domains/payments/*, app/camping/[id]/reserve.tsx | — |
| WS-RESERVA | src/domains/reservations/*, supabase/migrations/ (new) | — |
| WS-NOTIF | src/infrastructure/notifications/* | app/_layout.tsx (setup) |
| WS-OWNER | supabase/migrations/ (new), src/domains/camping/hooks.ts (claim) | — |
| WS-RELAY | infra/relay/* (new directory, Docker-only) | — |
| WS-BREEZ | src/infrastructure/wallet/breez.ts | — |
| WS-UGC | src/domains/map/components/RouteCreator.tsx, route hooks | — |
| WS-GPS | src/shared/hooks/useGPSVerification.ts | — |
| WS-ANALYTICS | src/domains/camping/components/OwnerDashboard.tsx, supabase/migrations/ (new) | — |

### Migration Coordination

Supabase migrations are append-only and timestamped. Multiple workstreams create migrations:
- Each workstream uses a unique timestamp prefix (YYYYMMDD + 2-digit WS code)
- WS-OWNER: 20260328_01_*
- WS-RESERVA: 20260328_02_*
- WS-ANALYTICS: 20260328_03_*
- WS-OWNLN: 20260328_04_*

## Execution Waves

### Wave 0 — Foundation (10 parallel agents)

All independent. Launch simultaneously.

| Agent | Issues | Est. Complexity | Key Deliverables |
|-------|--------|-----------------|------------------|
| agent-offline | #11 + #12 | Medium × 2 | onlineManager, focusManager, sync hook, offline map packs UI |
| agent-auth | #13 | Medium | AppState refresh, anonymous sign-in, email sign-up/in screens |
| agent-ndk | #17 | Large (CRITICAL) | NDK singleton, keypair generation, SecureStore nsec, relay connection |
| agent-eas | #15 | Medium | eas.json profiles, app.json runtimeVersion + updates |
| agent-gps | #21 | Small | useGPSVerification hook (distance check, proximity gate) |
| agent-owner | #27 + #28 | Medium × 2 | Owner claiming flow, curated routes with Mapbox |
| agent-notif | #29 | Large | expo-notifications setup, handlers, permission flow |
| agent-relay | #30 | Large (config only) | docker-compose.yml, strfry.conf, deploy script, README |
| agent-breez | #36 | Large (integration) | Breez SDK Liquid wrapper, fallback payment hook |

**Review checkpoint after Wave 0:** Code review all 10 branches before merging.

### Wave 1 — First Dependencies (5 parallel agents)

Starts after relevant Wave 0 agents complete.

| Agent | Issues | Blocked by | Key Deliverables |
|-------|--------|------------|------------------|
| agent-fav | #14 | #13 (auth) | FavoriteButton, MMKV local + Supabase sync, optimistic UI |
| agent-submit | #16 | #15 (EAS) | Privacy policy, eas.json submit config, store metadata |
| agent-reserva | #32 | #13 (auth) | Reservation flow UI, Zod schemas, Supabase table + RPC |
| agent-ownln | #35 | #27 (owner) | Lightning address registration, owner settings screen |
| agent-analytics | #40 | #27 (owner) | Analytics migration, RPC aggregation, dashboard UI |

**Review checkpoint after Wave 1.**

### Wave 2 — NDK Unlocked (5 parallel agents, 10 issues)

Starts after agent-ndk completes (Wave 0).

| Agent | Issues | Key Deliverables |
|-------|--------|------------------|
| agent-identity | #18 + #26 | Nostr profile (kind:0) CRUD, NIP-46 remote signer import |
| agent-social | #19 + #20 + #22 + #23 | Venue publishing (kind:37515), reviews (kind:1985), check-ins (kind:10037), feed with geo filter |
| agent-badges | #24 | Badge definitions (NIP-58), badge award events, badge display components |
| agent-nwc | #31 + #34 | NWCClient singleton, wallet connection UI, zap button + NIP-57 |
| agent-ugc | #39 | Route creator, GPX parser, route sharing via Nostr |

**Review checkpoint after Wave 2.**

### Wave 3 — Final Assembly (3 parallel agents, 4 issues)

| Agent | Issues | Blocked by | Key Deliverables |
|-------|--------|------------|------------------|
| agent-profile | #25 | #24 (badges) | Full profile screen with badge grid, stats, settings |
| agent-payments | #33 + #37 + #38 | #31 (NWC) | P2P Lightning payment flow, HODL invoices, Pro subscriptions |

**Final review checkpoint + integration merge.**

### Wave 4 — Integration (main orchestrator)

No agents. Main session:
1. Merge all branches sequentially (resolve any conflicts)
2. Wire providers in _layout.tsx (NDK, Auth, Notifications)
3. Update package.json with all new dependencies
4. Run full typecheck
5. Verify navigation between all screens
6. Update CLAUDE.md with new architecture

## External Infrastructure Notes

Issues requiring accounts/services the user may not have — all code is written, wiring documented:

| Issue | External Requirement | Code Status |
|-------|---------------------|-------------|
| #15/#16 | Apple Developer ($99), Google Play Console ($25) | eas.json complete, submit config with TODOs for credentials |
| #30 | VPS for Strfry relay | Docker config + deploy script ready, just needs `docker compose up` on server |
| #36 | Breez SDK API key + native build config | Wrapper complete, needs API key in env var |

## Quality Gates

Each review checkpoint:
1. `npm run typecheck` passes (zero errors)
2. No hardcoded secrets
3. Zod schemas are source of truth (no duplicate types)
4. Glass design system used correctly (GlassView + tokens)
5. NativeWind className only (no StyleSheet)
6. All Supabase calls use `.throwOnError()`
7. New hooks follow existing TanStack Query patterns
8. Migrations are idempotent and use IF NOT EXISTS

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| NDK Mobile compatibility with RN 0.83 | Blocks all Fase 2 | agent-ndk starts first, if blocked → mock NDK interface for other agents |
| @getalby/sdk RN compatibility | Blocks payments | agent-breez as fallback path |
| Merge conflicts in shared files | Delays integration | File ownership map enforced, _layout.tsx modified only in Wave 4 |
| Supabase migration conflicts | Data issues | Timestamp prefixes per workstream |
| Too many npm packages | Bundle size | Audit in Wave 4 integration |
