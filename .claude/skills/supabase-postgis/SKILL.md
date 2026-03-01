---
name: supabase-postgis
description: >
  Supabase + PostGIS patterns for geo queries, auth, RLS.
  Trigger: When working with database, migrations, RPC, geographic queries.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## Client Setup (React Native)

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const supabase = createClient<Database>(URL, ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,  // MMKV, not AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,    // REQUIRED for React Native
  },
});
```

## AppState Token Refresh (REQUIRED for RN)

```typescript
import { AppState } from "react-native";

AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

## PostGIS Coordinate Order: LONGITUDE FIRST (REQUIRED)

```sql
-- ✅ PostGIS: (longitude, latitude) — x, y
ST_MakePoint(-71.3442, -41.1245)      -- lon, lat
ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography

-- ❌ WRONG: (latitude, longitude)
ST_MakePoint(-41.1245, -71.3442)      -- lat, lon — WRONG!
```

## RPC Functions (Project)

```typescript
// ✅ Always use throwOnError with Supabase queries
const { data } = await supabase
  .rpc("get_campings_near", { lat, lng, radius_km: 50, lim: 100 })
  .throwOnError();

// Bounding box query
const { data } = await supabase
  .rpc("get_campings_in_bbox", { min_lat, min_lng, max_lat, max_lng })
  .throwOnError();

// Fuzzy text search (pg_trgm)
const { data } = await supabase
  .rpc("search_campings", { query: "lago", lim: 20 })
  .throwOnError();
```

## PostGIS Key Functions

```sql
-- Radius search (index-accelerated)
ST_DWithin(location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_m)

-- Distance in km
ST_Distance(location, point::geography) / 1000.0 AS distance_km

-- Bounding box
ST_Intersects(location, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography)

-- Nearest neighbor (fast with GIST index)
ORDER BY location <-> ST_Point(lng, lat)::geography

-- Extract coordinates
ST_Y(location::geometry) as lat    -- Y = latitude
ST_X(location::geometry) as lng    -- X = longitude
```

## Inserting Geography Data

```sql
-- WKT format for upsert
'SRID=4326;POINT(-71.3442 -41.1245)'

-- SQL function
ST_SetSRID(ST_MakePoint(-71.3442, -41.1245), 4326)::geography
```

## RLS Patterns

```sql
-- Public read
CREATE POLICY "select" ON campings FOR SELECT USING (true);

-- User-owned data
CREATE POLICY "select_own" ON favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance: wrap auth functions in SELECT
USING ((select auth.uid()) = user_id)  -- better than: auth.uid() = user_id

-- Anonymous vs permanent user
WITH CHECK ((select (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);
```

## Query Builder

```typescript
// Select with filters
const { data } = await supabase
  .from("campings")
  .select("id, name, province, amenities")
  .eq("province", "Neuquén")
  .ilike("name", "%lago%")
  .order("name")
  .limit(20)
  .throwOnError();

// Single row
const { data } = await supabase
  .from("campings")
  .select("*")
  .eq("id", id)
  .single()
  .throwOnError();

// JSONB contains
.contains("amenities", { wifi: true })

// Multiple conditions with OR
.or("province.eq.Mendoza,province.eq.Neuquén")
```

## Type Generation

```bash
supabase gen types typescript --local > src/infrastructure/supabase/database.types.ts
```

PostGIS geography columns type as `unknown`. Override with `MergeDeep` from `type-fest` or use views that unpack with `ST_X`/`ST_Y`.

## Migrations

```bash
supabase migration new <name>     # create timestamped file
supabase db reset                 # drop + re-run migrations + seed
supabase db diff --schema public  # auto-generate from dashboard changes
```

GIST index required for spatial performance:
```sql
CREATE INDEX idx_campings_location ON campings USING GIST(location);
```

## Auth Patterns

```typescript
// Anonymous sign-in (creates authenticated user with is_anonymous claim)
const { data } = await supabase.auth.signInAnonymously();

// Session listener
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
});
```

## Keywords
supabase, postgis, rpc, rls, geography, spatial, auth, migration, database
