# Xplorers

Directorio de campings para Argentina. Mapa interactivo + Comunidad Nostr + Pagos Lightning.

## Stack

- **Framework**: React Native + Expo SDK 55 (New Architecture enabled)
- **Routing**: Expo Router v4 (file-based)
- **UI**: NativeWind v4 + Gluestack UI v3 (Tailwind CSS v3)
- **State**: Zustand 5 (UI) + TanStack Query v5 (server)
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Social**: Nostr via NDK Mobile (Fase 2)
- **Payments**: NWC + Breez SDK Liquid (Fase 3)
- **Offline**: expo-sqlite + MMKV + Mapbox OfflineManager
- **Validation**: Zod
- **Maps**: @rnmapbox/maps (Mapbox v11)

## Architecture

Screaming Architecture with bounded domains:

```
app/             → Expo Router routes (thin shells only)
src/domains/     → Bounded contexts: camping, map, social, identity, payments, reservations
src/shared/      → Shared UI components, hooks, utils
src/infrastructure/ → Supabase client, NDK singleton, SQLite, MMKV, TanStack config
supabase/        → SQL migrations
scripts/scraper/ → Python data scrapers
```

## Conventions

- Routes in `app/` are thin shells — logic lives in `src/domains/`
- Each domain has: types.ts, hooks.ts, components/, api/
- Zod schemas are the source of truth for types
- NativeWind className for all styling (no StyleSheet)
- TanStack Query for all server state
- Zustand for UI-only state
- expo-sqlite for offline camping catalog
- MMKV for TanStack persister + Zustand persistence

## Phases

- **Fase 1** (current): MVP Directorio — mapa, listado, offline, búsqueda
- **Fase 2**: Social Nostr — reviews, check-ins, badges, feed
- **Fase 3**: Lightning Payments — reservas, zaps, monetización

## Key Commands

```bash
npx expo start          # Dev server
npx expo start --clear  # Clear cache
eas build --profile development --platform ios  # Dev build
```
