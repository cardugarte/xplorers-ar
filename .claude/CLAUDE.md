# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Xplorers — Directorio de campings para Argentina. Mapa interactivo + Comunidad Nostr + Pagos Lightning.

## Commands

```bash
# Dev server
npm run start              # expo start
npm run start:clear        # expo start --clear (use when metro cache issues)

# Type checking (no lint/test configured yet)
npm run typecheck          # tsc --noEmit

# Supabase local
npm run db:start           # supabase start (needs Docker)
npm run db:stop            # supabase stop
npm run db:reset           # supabase db reset (drops and re-runs migrations + seed)
npm run db:migration:new   # supabase migration new <name>
npm run db:gen-types       # generates src/infrastructure/supabase/database.types.ts

# Scraper (Python, zero external deps — stdlib only)
python scripts/scraper/pipeline.py              # full OSM → geocode → geohash pipeline
python scripts/scraper/pipeline.py --no-cache   # force re-download from Overpass
python scripts/scraper/upload.py                # upsert to Supabase (needs SUPABASE_SERVICE_ROLE_KEY)
python scripts/scraper/upload.py --dry-run      # preview without uploading

# EAS builds
eas build --profile development --platform ios  # dev client (simulator)
eas build --profile preview --platform ios      # preview (device)
```

## Architecture

Screaming Architecture with bounded domains. Routes are thin shells — all logic lives in `src/`.

```
app/                    → Expo Router v4 file-based routes
  (tabs)/               → Bottom tabs: map, discover, social, profile
  (auth)/               → Onboarding flow
  camping/[id]/         → Detail + reserve screens
src/domains/            → Bounded contexts (each has types.ts, hooks.ts, components/, api/)
  camping/              → Only domain with real logic (Fase 1). Zod schemas + TanStack Query hooks
  map/                  → MapRegion types, POPULAR_ZONES bounding boxes, ARGENTINA_CENTER coords
  social/               → Review/CheckIn/Badge types, BADGES constants (Fase 2)
  identity/             → NostrIdentity, AuthState (Fase 2)
  payments/             → NWC/Lightning types, ReservationStatus (Fase 3)
  reservations/         → ReservationSchema Zod (Fase 3)
src/shared/
  theme/tokens.ts       → Source of truth for all colors (andes/glaciar/crepusculo), semantic values
  theme/glass.ts        → 7 glass presets (ultra/mid/soft/andes/glaciar/crepusculo/btn) + BLUR_INTENSITY
  components/GlassView  → Reusable glass component (BlurView when blur=true, opaque fallback)
src/infrastructure/
  supabase/client.ts    → createClient<Database> with MMKV auth storage adapter
  supabase/types.ts     → Manual Database type (campings table + RPC functions)
  tanstack/queryClient   → staleTime: 15min, gcTime: 24h, retry: 2
  storage/mmkv.ts       → MMKV singleton (id: "xplorers-storage") + Supabase auth adapter
  storage/campingDatabase.ts → expo-sqlite offline catalog (upsert + bounding box query)
  nostr/ndk.ts          → Placeholder: relay URLs, NOSTR_KINDS including custom CAMPING_VENUE(37515)
supabase/migrations/    → PostGIS-enabled schema, RLS, RPC functions
scripts/scraper/        → Python pipeline: OSM Overpass → georef-ar reverse geocode → geohash → Supabase
```

## Stack

- **React Native 0.83 + Expo SDK 55** (New Architecture enabled, typed routes)
- **Expo Router v4** — file-based routing, path alias `@/*` → repo root
- **NativeWind v4 + Tailwind CSS v3** — className for all styling, no StyleSheet
- **Gluestack UI v3** — component primitives (overlay, toast)
- **TanStack Query v5** — server state (persister packages installed but not wired yet)
- **Zustand 5** — UI-only state
- **Supabase** — PostgreSQL + PostGIS, anon auth, RPC for geo queries
- **Zod** — schemas are the source of truth for TypeScript types
- **expo-sqlite** — offline camping catalog
- **MMKV** — fast KV for auth persistence + future TanStack/Zustand persistence
- **lucide-react-native** — icons

## Key Patterns

- **Zod-first types**: Domain types derived from Zod schemas via `z.infer<>`. Never duplicate types manually.
- **TanStack Query hooks**: Live in `src/domains/<domain>/hooks.ts`. Use Supabase client directly, no separate API layer yet.
- **Geo queries**: Supabase RPC functions (`get_campings_near`, `get_campings_in_bbox`, `search_campings`) use PostGIS. The SQLite offline DB uses flat lat/lon with bounding box queries.
- **Glass design system**: Use `GlassView` component with `level` prop. Glass text colors are hardcoded (not CSS vars) for WCAG AA contrast. Light mode = dark text, dark mode = light text.
- **NativeWind custom classes**: `font-heading`, `font-body`, `font-label`, `font-display` + color scales `text-andes-*`, `text-glaciar-*`, `text-crepusculo-*`.
- **Scraper pipeline**: Pure Python stdlib. OSM tags are mapped to camping amenities/type. Reverse geocoding via georef-ar-api (Argentina government API). Geohash precision 5.

## Database

PostGIS-enabled PostgreSQL via Supabase. Key details:
- `campings.location` is `GEOGRAPHY(POINT, 4326)` — stored as WKT `SRID=4326;POINT(lon lat)` for upload
- `campings.source` CHECK constraint: `'sinta' | 'scraped' | 'community' | 'osm'`
- `campings.amenities` is JSONB with GIN index
- `campings.name` has GIN trigram index for fuzzy search
- RLS enabled on all tables (campings, favorites, error_reports)
- Seed data: 12 real verified campings across Argentina

## Env Variables

Required in `.env` (see Supabase local output for values):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

For scraper upload only:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Phases

- **Fase 1** (current): MVP Directorio — map, listing, offline, search. Most screens are placeholder stubs.
- **Fase 2**: Social Nostr — reviews, check-ins, badges, feed via NDK Mobile
- **Fase 3**: Lightning Payments — reservations, zaps, monetization via NWC + Breez SDK
