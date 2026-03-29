# Complete All Phases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 30 remaining issues (#11-#40) across Fase 1, 2, and 3 of Xplorers — a React Native camping directory for Argentina with Nostr social and Lightning payments.

**Architecture:** Screaming Architecture with bounded domains. Each workstream operates in an isolated git worktree touching only its owned files. Shared files (`_layout.tsx`, `package.json`) are modified only in the final integration task. Supabase migrations use timestamped prefixes per workstream to avoid conflicts.

**Tech Stack:** React Native 0.83, Expo SDK 55, Expo Router v4, NativeWind v4, TanStack Query v5, Zustand 5, Supabase (PostGIS), Zod, MMKV, @rnmapbox/maps, NDK Mobile, @getalby/sdk, Breez SDK Liquid

**Validation:** No test framework configured. All tasks validate with `npx tsc --noEmit`. UI validation is manual.

**Design Spec:** `docs/superpowers/specs/2026-03-28-complete-all-phases-design.md`

---

## Conventions for All Tasks

Every agent MUST follow these patterns:

1. **Zod-first types:** Define Zod schemas, derive TS types via `z.infer<>`. Never duplicate types manually.
2. **TanStack Query hooks:** Live in `src/domains/<domain>/hooks.ts`. All Supabase calls MUST use `.throwOnError()` or manually throw on error.
3. **NativeWind only:** Use `className` for all styling. No `StyleSheet.create()`.
4. **Glass design system:** Use `GlassView` component with `level` prop for glass surfaces.
5. **Imports:** Use `@/` path alias (maps to repo root). Example: `@/src/domains/camping/types`.
6. **Icons:** Use `lucide-react-native`.
7. **Supabase migrations:** Append-only. Use `IF NOT EXISTS`. Never edit existing migration files.
8. **Commit format:** `feat(<domain>): <description>` — no Co-Authored-By.

---

## Wave 0 — Foundation (9 parallel agents, 11 issues)

All tasks in this wave are independent. Launch ALL simultaneously.

---

### Task 1: Offline Cache + Offline Maps (#11 + #12)

**Goal:** Make the app work offline — cache camping data in SQLite, download Mapbox map packs.

**Branch:** `feat/11-12-offline-cache-maps`

**Files:**
- Create: `src/infrastructure/tanstack/onlineManager.ts`
- Create: `src/infrastructure/tanstack/focusManager.ts`
- Create: `src/domains/camping/useSyncCampings.ts`
- Create: `src/domains/map/hooks.ts`
- Create: `src/domains/map/components/OfflinePackManager.tsx`
- Create: `src/domains/map/components/OfflinePackCard.tsx`
- Modify: `src/infrastructure/storage/campingDatabase.ts` (add WAL pragma)
- Modify: `src/infrastructure/tanstack/queryClient.ts` (add networkMode)

**GitHub Issues:** Read #11 and #12 via `gh issue view 11 --json body` and `gh issue view 12 --json body` for full implementation references.

- [ ] **Step 1: Install NetInfo**

```bash
npx expo install @react-native-community/netinfo
```

- [ ] **Step 2: Create onlineManager.ts**

```typescript
// src/infrastructure/tanstack/onlineManager.ts
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

export function setupOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
  });
}
```

- [ ] **Step 3: Create focusManager.ts**

```typescript
// src/infrastructure/tanstack/focusManager.ts
import { AppState, type AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";

export function setupFocusManager() {
  const subscription = AppState.addEventListener(
    "change",
    (status: AppStateStatus) => {
      focusManager.setFocused(status === "active");
    },
  );
  return () => subscription.remove();
}
```

- [ ] **Step 4: Add WAL mode to campingDatabase.ts**

Add after `openDatabaseAsync`:
```typescript
await db.execAsync("PRAGMA journal_mode = WAL;");
```

- [ ] **Step 5: Add networkMode to queryClient.ts**

Add to defaultOptions.queries:
```typescript
networkMode: "always" as const,
```

- [ ] **Step 6: Create sync hook**

```typescript
// src/domains/camping/useSyncCampings.ts
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";
import { storage } from "@/src/infrastructure/storage/mmkv";
import {
  getCampingDatabase,
  upsertCamping,
} from "@/src/infrastructure/storage/campingDatabase";

const SYNC_KEY = "camping-sync-timestamp";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Argentina full bounds
const ARGENTINA_BOUNDS = {
  min_lat: -55.0,
  max_lat: -21.0,
  min_lng: -73.5,
  max_lng: -53.5,
};

export function useSyncCampingsToSQLite() {
  const lastSync = storage.getNumber(SYNC_KEY) ?? 0;
  const shouldSync = Date.now() - lastSync > SYNC_INTERVAL_MS;

  const { data } = useQuery({
    queryKey: ["campings", "sync-all"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_campings_in_bbox",
        ARGENTINA_BOUNDS,
      );
      if (error) throw error;
      return data as Record<string, unknown>[];
    },
    enabled: shouldSync,
    staleTime: SYNC_INTERVAL_MS,
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    async function syncToSQLite() {
      await getCampingDatabase();
      for (const camping of data!) {
        await upsertCamping({
          id: camping.id as string,
          name: camping.name as string,
          slug: camping.slug as string,
          latitude: camping.latitude as number,
          longitude: camping.longitude as number,
          province: camping.province as string,
          geohash: camping.geohash as string,
          amenities: JSON.stringify(camping.amenities ?? {}),
          prices: camping.prices ? JSON.stringify(camping.prices) : null,
          contact: camping.contact ? JSON.stringify(camping.contact) : null,
          photos: camping.photos ? JSON.stringify(camping.photos) : null,
          source: camping.source as string,
          verified: (camping.verified as boolean) ?? false,
          owner_npub: (camping.owner_npub as string) ?? null,
          owner_lightning_address:
            (camping.owner_lightning_address as string) ?? null,
          created_at: camping.created_at as string,
          updated_at: camping.updated_at as string,
        });
      }
      storage.set(SYNC_KEY, Date.now());
    }
    syncToSQLite();
  }, [data]);
}
```

- [ ] **Step 7: Create offline map hooks**

```typescript
// src/domains/map/hooks.ts
import { useState, useEffect, useCallback } from "react";
import Mapbox from "@rnmapbox/maps";

import { POPULAR_ZONES, toMapboxBounds } from "./types";

const ZONE_MAX_ZOOM: Record<string, number> = {
  "patagonia-sur": 12,
};
const DEFAULT_MAX_ZOOM = 14;
const MIN_ZOOM = 8;
const MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12";

export interface OfflinePackStatus {
  name: string;
  progress: number;
  isDownloading: boolean;
  isComplete: boolean;
  size: number | null;
}

export function useOfflinePacks() {
  const [packs, setPacks] = useState<Mapbox.OfflinePack[]>([]);

  const refresh = useCallback(async () => {
    const existing = await Mapbox.offlineManager.getPacks();
    setPacks(existing ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { packs, refresh };
}

export function useOfflinePackDownload(zoneId: string) {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const zone = POPULAR_ZONES.find((z) => z.id === zoneId);

  const startDownload = useCallback(async () => {
    if (!zone) return;
    setIsDownloading(true);
    setProgress(0);

    const bounds = toMapboxBounds(zone.bounds);
    const maxZoom = ZONE_MAX_ZOOM[zoneId] ?? DEFAULT_MAX_ZOOM;

    await Mapbox.offlineManager.createPack(
      {
        name: zoneId,
        styleURL: MAP_STYLE,
        minZoom: MIN_ZOOM,
        maxZoom,
        bounds: [bounds.ne, bounds.sw],
      },
      (_region, status) => {
        setProgress(status.percentage);
        if (status.percentage >= 100) {
          setIsDownloading(false);
        }
      },
    );
  }, [zone, zoneId]);

  const deletePack = useCallback(async () => {
    await Mapbox.offlineManager.deletePack(zoneId);
    setProgress(0);
  }, [zoneId]);

  return { progress, isDownloading, startDownload, deletePack };
}
```

- [ ] **Step 8: Create OfflinePackManager component**

Build a screen component showing POPULAR_ZONES as downloadable cards. Each card shows zone name, download button, progress bar, and delete option. Use `GlassView` with `level="soft"` for cards, `lucide-react-native` icons (Download, Trash2, MapPin).

- [ ] **Step 9: Create OfflinePackCard component**

Individual card component using `useOfflinePackDownload(zoneId)`. Show progress as a bar when downloading. Show size estimate (use `~3 MB` for normal zones, `~8 MB` for patagonia-sur at z12).

- [ ] **Step 10: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(offline): wire SQLite sync, NetInfo online manager, Mapbox offline packs"
```

---

### Task 2: Auth Básico (#13)

**Goal:** Implement Supabase auth with anonymous auto-sign-in and email upgrade flow.

**Branch:** `feat/13-auth-basico`

**Files:**
- Create: `src/domains/identity/hooks.ts`
- Create: `src/domains/identity/store.ts`
- Create: `app/(auth)/sign-in.tsx`
- Create: `app/(auth)/sign-up.tsx`
- Modify: `src/infrastructure/supabase/client.ts` (add AppState listener)
- Modify: `app/(auth)/onboarding.tsx`

**GitHub Issue:** Read #13 via `gh issue view 13 --json body` for full implementation references.

- [ ] **Step 1: Add AppState listener to client.ts**

Add after the `createClient` call:
```typescript
import { AppState } from "react-native";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

- [ ] **Step 2: Create auth store**

```typescript
// src/domains/identity/store.ts
import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

interface AuthStore {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  isAnonymous: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  isLoading: true,
  setSession: (session) => set({ session, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  isAnonymous: () => {
    const session = get().session;
    return session?.user?.is_anonymous ?? true;
  },
}));
```

- [ ] **Step 3: Create auth hooks**

```typescript
// src/domains/identity/hooks.ts
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

import { useAuthStore } from "./store";

export function useEnsureSession() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      } else {
        supabase.auth.signInAnonymously().then(({ data: { session } }) => {
          setSession(session);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);
}

export function useSignUp() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpgradeAnonymous() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });
}
```

- [ ] **Step 4: Build sign-in screen**

Create `app/(auth)/sign-in.tsx` — email + password form with `useSignIn()` hook. GlassView card, NativeWind styling, error display, link to sign-up. Spanish labels.

- [ ] **Step 5: Build sign-up screen**

Create `app/(auth)/sign-up.tsx` — email + password + confirm password form with `useSignUp()` hook. Handle anonymous upgrade path with `useUpgradeAnonymous()` when `useAuthStore().isAnonymous()` is true.

- [ ] **Step 6: Update onboarding.tsx**

Replace placeholder with welcome screen. Show app name, brief description, "Continuar sin cuenta" (anonymous) and "Crear cuenta" buttons.

- [ ] **Step 7: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(auth): implement Supabase auth with anonymous auto-sign-in and email upgrade"
```

---

### Task 3: NDK Mobile Integration (#17) — CRITICAL PATH

**Goal:** Initialize NDK Mobile as singleton, generate Nostr keypair, store nsec in SecureStore, connect to relays. This unblocks ALL Fase 2 social features.

**Branch:** `feat/17-ndk-mobile`

**Files:**
- Create: `src/infrastructure/nostr/provider.tsx`
- Create: `src/infrastructure/nostr/useNDK.ts`
- Modify: `src/infrastructure/nostr/ndk.ts` (replace placeholder with real singleton)
- Modify: `src/domains/identity/types.ts` (extend with NDK types)

**GitHub Issue:** Read #17 via `gh issue view 17 --json body` for full implementation references including crypto polyfill setup.

- [ ] **Step 1: Install dependencies**

```bash
npx expo install @nostr-dev-kit/ndk-mobile nostr-tools react-native-get-random-values react-native-quick-crypto
```

- [ ] **Step 2: Replace ndk.ts placeholder with real singleton**

```typescript
// src/infrastructure/nostr/ndk.ts
import NDK, {
  NDKCacheAdapterSqlite,
  NDKPrivateKeySigner,
} from "@nostr-dev-kit/ndk-mobile";
import * as SecureStore from "expo-secure-store";
import { nip19 } from "nostr-tools";

export const RELAY_URLS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
] as const;

export const NOSTR_KINDS = {
  METADATA: 0,
  SHORT_TEXT_NOTE: 1,
  REACTION: 7,
  COMMENT: 1111,
  ZAP_RECEIPT: 9735,
  PROFILE_BADGES: 30008,
  BADGE_DEFINITION: 30009,
  STATUS: 30315,
  CAMPING_VENUE: 37515,
  REVIEW: 1985,
  CHECK_IN: 10037,
  ROUTE: 30402,
} as const;

const NSEC_KEY = "nostr-nsec";
let ndkInstance: NDK | null = null;

export async function getStoredNsec(): Promise<string | null> {
  return SecureStore.getItemAsync(NSEC_KEY);
}

export async function storeNsec(nsec: string): Promise<void> {
  await SecureStore.setItemAsync(NSEC_KEY, nsec);
}

export async function deleteNsec(): Promise<void> {
  await SecureStore.deleteItemAsync(NSEC_KEY);
}

export async function initNDK(
  signer?: NDKPrivateKeySigner,
): Promise<NDK> {
  if (ndkInstance) return ndkInstance;

  const cacheAdapter = new NDKCacheAdapterSqlite("xplorers-ndk");

  ndkInstance = new NDK({
    explicitRelayUrls: [...RELAY_URLS],
    cacheAdapter,
    signer,
    enableOutboxModel: true,
  });

  await ndkInstance.connect();
  return ndkInstance;
}

export function getNDK(): NDK | null {
  return ndkInstance;
}

export async function generateKeypair(): Promise<{
  npub: string;
  nsec: string;
  signer: NDKPrivateKeySigner;
}> {
  const signer = NDKPrivateKeySigner.generate();
  const user = await signer.user();
  const npub = user.npub;
  const privkey = signer.privateKey;

  if (!privkey) throw new Error("Failed to generate private key");

  const nsec = nip19.nsecEncode(privkey);
  await storeNsec(nsec);

  return { npub, nsec, signer };
}

export async function restoreKeypair(): Promise<NDKPrivateKeySigner | null> {
  const nsec = await getStoredNsec();
  if (!nsec) return null;

  const { data } = nip19.decode(nsec);
  return new NDKPrivateKeySigner(data as Uint8Array);
}
```

- [ ] **Step 3: Create NDK provider**

```typescript
// src/infrastructure/nostr/provider.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type NDK from "@nostr-dev-kit/ndk-mobile";

import { initNDK, restoreKeypair } from "./ndk";

interface NDKContextValue {
  ndk: NDK | null;
  isReady: boolean;
}

const NDKContext = createContext<NDKContextValue>({
  ndk: null,
  isReady: false,
});

export function NDKProvider({ children }: { children: ReactNode }) {
  const [ndk, setNdk] = useState<NDK | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setup() {
      const signer = await restoreKeypair();
      const instance = await initNDK(signer ?? undefined);
      setNdk(instance);
      setIsReady(true);
    }
    setup();
  }, []);

  return (
    <NDKContext.Provider value={{ ndk, isReady }}>
      {children}
    </NDKContext.Provider>
  );
}

export function useNDKContext() {
  return useContext(NDKContext);
}
```

- [ ] **Step 4: Create useNDK hook**

```typescript
// src/infrastructure/nostr/useNDK.ts
import { useNDKContext } from "./provider";

export function useNDK() {
  const { ndk, isReady } = useNDKContext();

  if (!ndk && isReady) {
    throw new Error("NDK not initialized");
  }

  return { ndk, isReady };
}
```

- [ ] **Step 5: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(nostr): integrate NDK Mobile with keypair generation and SecureStore"
```

---

### Task 4: EAS Build + Update (#15)

**Goal:** Configure EAS Build with 3 profiles and EAS Update for OTA.

**Branch:** `feat/15-eas-build`

**Files:**
- Modify: `eas.json`
- Modify: `app.json` (add runtimeVersion + updates)

**GitHub Issue:** Read #15 via `gh issue view 15 --json body`.

- [ ] **Step 1: Read current eas.json**

Read the file first, then update.

- [ ] **Step 2: Update eas.json with full profile config**

Add development/preview/production profiles with channels, resourceClass, submit config with TODO placeholders for Apple/Google credentials.

- [ ] **Step 3: Add runtimeVersion and updates to app.json**

Add to the expo config:
```json
"runtimeVersion": {
  "policy": "appVersion"
},
"updates": {
  "url": "https://u.expo.dev/46bc471c-3824-4cfd-92be-2f173995c1f2"
}
```

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(infra): configure EAS Build profiles and EAS Update channels"
```

---

### Task 5: GPS Proximity Verification (#21)

**Goal:** Create a hook that verifies if a user is physically near a camping (for review/check-in validation).

**Branch:** `feat/21-gps-proximity`

**Files:**
- Create: `src/shared/hooks/useGPSVerification.ts`

**GitHub Issue:** Read #21 via `gh issue view 21 --json body`.

- [ ] **Step 1: Create verification hook**

```typescript
// src/shared/hooks/useGPSVerification.ts
import { useState, useCallback } from "react";
import * as Location from "expo-location";

const EARTH_RADIUS_KM = 6371;
const DEFAULT_PROXIMITY_KM = 0.5; // 500m

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface VerificationResult {
  isNear: boolean;
  distanceKm: number;
  userLat: number;
  userLng: number;
  timestamp: number;
}

export function useGPSVerification(
  targetLat: number,
  targetLng: number,
  proximityKm = DEFAULT_PROXIMITY_KM,
) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permiso de ubicación denegado");
        setIsVerifying(false);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const distanceKm = haversineDistance(
        location.coords.latitude,
        location.coords.longitude,
        targetLat,
        targetLng,
      );

      const verification: VerificationResult = {
        isNear: distanceKm <= proximityKm,
        distanceKm,
        userLat: location.coords.latitude,
        userLng: location.coords.longitude,
        timestamp: Date.now(),
      };

      setResult(verification);
      setIsVerifying(false);
      return verification;
    } catch (e) {
      setError("Error al obtener ubicación");
      setIsVerifying(false);
      return null;
    }
  }, [targetLat, targetLng, proximityKm]);

  return { result, isVerifying, error, verify };
}
```

- [ ] **Step 2: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(shared): add GPS proximity verification hook"
```

---

### Task 6: Owner Claiming + Curated Routes (#27 + #28)

**Goal:** Allow camping owners to claim listings, and add curated tourist routes displayed on the map.

**Branch:** `feat/27-28-owner-routes`

**Files:**
- Create: `supabase/migrations/20260328010000_owner_claiming.sql`
- Create: `supabase/migrations/20260328010001_curated_routes.sql`
- Create: `src/domains/camping/useOwnerClaiming.ts`
- Create: `src/domains/camping/components/ClaimOwnershipModal.tsx`
- Create: `src/domains/map/components/CuratedRouteCard.tsx`
- Create: `src/domains/map/components/CuratedRoutesList.tsx`
- Create: `src/domains/map/useRoutes.ts`

**GitHub Issues:** Read #27 and #28 via `gh issue view 27 --json body` and `gh issue view 28 --json body`.

- [ ] **Step 1: Create owner claiming migration**

```sql
-- supabase/migrations/20260328010000_owner_claiming.sql
CREATE TABLE IF NOT EXISTS owner_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  camping_id UUID NOT NULL REFERENCES campings(id),
  claimer_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  evidence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(camping_id, claimer_id)
);

ALTER TABLE owner_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create claims" ON owner_claims
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = claimer_id);

CREATE POLICY "Users can view own claims" ON owner_claims
  FOR SELECT TO authenticated
  USING (auth.uid() = claimer_id);
```

- [ ] **Step 2: Create curated routes migration**

```sql
-- supabase/migrations/20260328010001_curated_routes.sql
CREATE TABLE IF NOT EXISTS curated_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  region TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  duration_days INTEGER,
  camping_ids UUID[] NOT NULL,
  waypoints JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE curated_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read routes" ON curated_routes
  FOR SELECT USING (true);

-- RPC to get route with campings
CREATE OR REPLACE FUNCTION get_route_with_campings(route_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'route', r,
    'campings', (
      SELECT json_agg(c)
      FROM campings c
      WHERE c.id = ANY(r.camping_ids)
    )
  )
  FROM curated_routes r
  WHERE r.id = route_id;
$$ LANGUAGE sql STABLE;
```

- [ ] **Step 3: Build owner claiming hooks and modal**

Create `useOwnerClaiming.ts` with `useSubmitClaim()` mutation and `useClaimStatus()` query. Build `ClaimOwnershipModal.tsx` with evidence text input and submit button.

- [ ] **Step 4: Build curated routes hooks and components**

Create `useRoutes.ts` with `useCuratedRoutes()` query. Build `CuratedRouteCard.tsx` and `CuratedRoutesList.tsx` for displaying routes. Each route card shows name, region, difficulty badge, duration, and number of campings.

- [ ] **Step 5: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(camping): add owner claiming flow and curated tourist routes"
```

---

### Task 7: Push Notifications (#29)

**Goal:** Set up expo-notifications with permission request, token registration, and notification handlers.

**Branch:** `feat/29-push-notifications`

**Files:**
- Create: `src/infrastructure/notifications/setup.ts`
- Create: `src/infrastructure/notifications/handlers.ts`
- Create: `src/infrastructure/notifications/usePushNotifications.ts`

**GitHub Issue:** Read #29 via `gh issue view 29 --json body`.

- [ ] **Step 1: Create notification setup**

```typescript
// src/infrastructure/notifications/setup.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: "46bc471c-3824-4cfd-92be-2f173995c1f2",
  });

  return token.data;
}
```

- [ ] **Step 2: Create notification handlers**

```typescript
// src/infrastructure/notifications/handlers.ts
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

export function setupNotificationHandlers() {
  const subscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.campingId) {
        router.push(`/camping/${data.campingId}`);
      }
    });

  return () => subscription.remove();
}
```

- [ ] **Step 3: Create usePushNotifications hook**

```typescript
// src/infrastructure/notifications/usePushNotifications.ts
import { useEffect, useState } from "react";

import { supabase } from "@/src/infrastructure/supabase/client";

import { registerForPushNotifications } from "./setup";
import { setupNotificationHandlers } from "./handlers";

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications().then((t) => {
      if (t) {
        setToken(t);
        // Store token in Supabase for server-side push
        supabase
          .from("push_tokens" as string)
          .upsert({ token: t, platform: "expo" })
          .then(() => {});
      }
    });

    const cleanup = setupNotificationHandlers();
    return cleanup;
  }, []);

  return { token };
}
```

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(notifications): setup expo-notifications with handlers and token registration"
```

---

### Task 8: Relay Strfry Config (#30)

**Goal:** Create Docker-based Strfry relay configuration ready for deployment.

**Branch:** `feat/30-relay-strfry`

**Files:**
- Create: `infra/relay/docker-compose.yml`
- Create: `infra/relay/strfry.conf`
- Create: `infra/relay/deploy.sh`

**GitHub Issue:** Read #30 via `gh issue view 30 --json body`.

- [ ] **Step 1: Create docker-compose.yml**

```yaml
# infra/relay/docker-compose.yml
version: "3.8"
services:
  strfry:
    image: dockurr/strfry:latest
    container_name: xplorers-relay
    ports:
      - "7777:7777"
    volumes:
      - ./strfry.conf:/etc/strfry.conf:ro
      - strfry-data:/app/strfry-db
    restart: unless-stopped

volumes:
  strfry-data:
```

- [ ] **Step 2: Create strfry.conf**

Configure with Xplorers-specific settings: accepted event kinds (0, 1, 7, 1111, 1985, 9735, 10037, 30008, 30009, 30315, 30402, 37515), max event size 128KB, rate limiting.

- [ ] **Step 3: Create deploy.sh**

```bash
#!/usr/bin/env bash
# infra/relay/deploy.sh
set -euo pipefail
echo "Deploying Xplorers Strfry relay..."
docker compose up -d
echo "Relay running at ws://localhost:7777"
echo "Configure reverse proxy (nginx/caddy) for wss://relay.xplorers.app"
```

- [ ] **Step 4: Commit**

```bash
chmod +x infra/relay/deploy.sh
git add -A && git commit -m "feat(infra): add Strfry relay Docker config for self-hosted Nostr relay"
```

---

### Task 9: Breez SDK Liquid (#36)

**Goal:** Create Breez SDK Liquid wrapper as a fallback payment method.

**Branch:** `feat/36-breez-sdk`

**Files:**
- Create: `src/infrastructure/wallet/breez.ts`
- Create: `src/domains/payments/useBreezWallet.ts`

**GitHub Issue:** Read #36 via `gh issue view 36 --json body`.

- [ ] **Step 1: Create Breez SDK wrapper**

```typescript
// src/infrastructure/wallet/breez.ts
// Breez SDK Liquid integration — requires native module + API key
// Install: npm install @aspect-build/react-native-breez-sdk-liquid
// API key: set BREEZ_API_KEY in env

import * as SecureStore from "expo-secure-store";

const BREEZ_MNEMONIC_KEY = "breez-mnemonic";

export interface BreezConfig {
  apiKey: string;
  workingDir: string;
}

export interface BreezPaymentResult {
  txId: string;
  amountSat: number;
  feesSat: number;
}

// Placeholder — actual Breez SDK requires native build
// This module exports the interface so consumers can code against it
// Wire to real SDK when native build is available

export async function initBreez(_config: BreezConfig): Promise<void> {
  // TODO: Initialize Breez SDK Liquid with config
  // await connect({ config: defaultConfig, mnemonic });
}

export async function getBreezBalance(): Promise<number> {
  // TODO: return (await getInfo()).balanceSat
  return 0;
}

export async function payBreezInvoice(
  bolt11: string,
): Promise<BreezPaymentResult> {
  // TODO: const payment = await payInvoice({ bolt11 });
  // return { txId: payment.txId, amountSat: payment.amountSat, feesSat: payment.feesSat };
  throw new Error(
    `Breez SDK not initialized. Install native module and set BREEZ_API_KEY. Invoice: ${bolt11}`,
  );
}

export async function receiveBreezPayment(
  amountSat: number,
): Promise<string> {
  // TODO: const invoice = await receivePayment({ amountSat });
  // return invoice.lnInvoice.bolt11;
  throw new Error(
    `Breez SDK not initialized. Amount: ${amountSat}`,
  );
}

export async function storeMnemonic(mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(BREEZ_MNEMONIC_KEY, mnemonic);
}

export async function getMnemonic(): Promise<string | null> {
  return SecureStore.getItemAsync(BREEZ_MNEMONIC_KEY);
}
```

- [ ] **Step 2: Create useBreezWallet hook**

```typescript
// src/domains/payments/useBreezWallet.ts
import { useState, useCallback } from "react";

import {
  getBreezBalance,
  payBreezInvoice,
  type BreezPaymentResult,
} from "@/src/infrastructure/wallet/breez";

export function useBreezWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const bal = await getBreezBalance();
      setBalance(bal);
    } catch (e) {
      setError("Breez SDK no disponible");
    }
  }, []);

  const pay = useCallback(
    async (bolt11: string): Promise<BreezPaymentResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payBreezInvoice(bolt11);
        await refreshBalance();
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de pago");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBalance],
  );

  return { balance, isLoading, error, refreshBalance, pay };
}
```

- [ ] **Step 3: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(payments): add Breez SDK Liquid wrapper as fallback payment method"
```

---

## Wave 0 Review Checkpoint

After ALL Wave 0 agents complete:

- [ ] **Review all 9 branches** using `superpowers:requesting-code-review` skill
- [ ] **Merge into main** in this order: EAS (#15), GPS (#21), Relay (#30), Breez (#36), Offline (#11+#12), Auth (#13), NDK (#17), Notifications (#29), Owner (#27+#28)
- [ ] **Resolve conflicts** in shared files if any
- [ ] **Run typecheck** on main after all merges

---

## Wave 1 — First Dependencies (5 parallel agents)

Launch after the relevant Wave 0 dependency is merged.

---

### Task 10: Favorites (#14)

**Goal:** Toggle favorite campings with MMKV local persistence and Supabase sync for authenticated users.

**Branch:** `feat/14-favorites`
**Depends on:** Task 2 (auth) merged into main

**Files:**
- Create: `src/domains/camping/favorites.ts`
- Create: `src/domains/camping/components/FavoriteButton.tsx`
- Create: `src/domains/camping/useFavorites.ts`

**GitHub Issue:** Read #14 via `gh issue view 14 --json body`.

- [ ] **Step 1: Create local favorites storage**

```typescript
// src/domains/camping/favorites.ts
import { storage } from "@/src/infrastructure/storage/mmkv";

const FAVORITES_KEY = "favorites";

export function getLocalFavorites(): string[] {
  const raw = storage.getString(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setLocalFavorites(ids: string[]) {
  storage.set(FAVORITES_KEY, JSON.stringify(ids));
}

export function toggleLocalFavorite(campingId: string): boolean {
  const favorites = getLocalFavorites();
  const index = favorites.indexOf(campingId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(campingId);
  }
  setLocalFavorites(favorites);
  return index < 0;
}
```

- [ ] **Step 2: Create favorites hooks with optimistic UI**

```typescript
// src/domains/camping/useFavorites.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { supabase } from "@/src/infrastructure/supabase/client";
import { useAuthStore } from "@/src/domains/identity/store";

import { getLocalFavorites, toggleLocalFavorite } from "./favorites";

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => getLocalFavorites(),
    staleTime: Infinity,
  });
}

export function useIsFavorite(campingId: string) {
  const { data: favorites = [] } = useFavorites();
  return favorites.includes(campingId);
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const isAnonymous = useAuthStore((s) => s.isAnonymous());

  return useMutation({
    mutationFn: async (campingId: string) => {
      const added = toggleLocalFavorite(campingId);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!isAnonymous) {
        if (added) {
          await supabase
            .from("favorites")
            .insert({ camping_id: campingId })
            .throwOnError();
        } else {
          await supabase
            .from("favorites")
            .delete()
            .eq("camping_id", campingId)
            .throwOnError();
        }
      }

      return added;
    },
    onMutate: async (campingId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const previous = queryClient.getQueryData<string[]>(["favorites"]);
      queryClient.setQueryData<string[]>(["favorites"], (old = []) =>
        old.includes(campingId)
          ? old.filter((id) => id !== campingId)
          : [...old, campingId],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["favorites"], context?.previous);
    },
  });
}
```

- [ ] **Step 3: Create FavoriteButton component**

Heart icon (lucide Heart/HeartOff) with `useToggleFavorite()`. Filled red when favorited. Positioned absolutely top-right on cards.

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(camping): add favorites with MMKV persistence and Supabase sync"
```

---

### Task 11: Store Submission (#16)

**Goal:** Prepare store submission config and privacy policy.

**Branch:** `feat/16-store-submission`
**Depends on:** Task 4 (EAS) merged into main

**Files:**
- Create: `docs/privacy-policy.md`
- Modify: `eas.json` (add submit section with TODOs)
- Modify: `app.json` (verify metadata)

**GitHub Issue:** Read #16 via `gh issue view 16 --json body`.

- [ ] **Step 1: Create privacy policy**

Write Spanish-language privacy policy covering: location usage (foreground only), anonymous IDs (Supabase), third parties (Mapbox, Supabase), Ley 25.326 compliance, no UGC in Fase 1, data deletion contact.

- [ ] **Step 2: Add submit config to eas.json**

Add submit.production with placeholder TODOs for Apple and Google credentials.

- [ ] **Step 3: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(infra): prepare store submission config and privacy policy"
```

---

### Task 12: Reservation Flow (#32)

**Goal:** Build the reservation flow UI with date selection, guest count, and booking summary.

**Branch:** `feat/32-reservation-flow`
**Depends on:** Task 2 (auth) merged into main

**Files:**
- Create: `supabase/migrations/20260328020000_reservations.sql`
- Create: `src/domains/reservations/hooks.ts`
- Create: `src/domains/reservations/components/DateRangePicker.tsx`
- Create: `src/domains/reservations/components/GuestCounter.tsx`
- Create: `src/domains/reservations/components/BookingSummary.tsx`
- Modify: `app/camping/[id]/reserve.tsx` (replace placeholder)

**GitHub Issue:** Read #32 via `gh issue view 32 --json body`.

- [ ] **Step 1: Create reservations migration**

```sql
-- supabase/migrations/20260328020000_reservations.sql
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  camping_id UUID NOT NULL REFERENCES campings(id),
  user_id UUID NOT NULL,
  camper_npub TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  notes TEXT,
  total_sats BIGINT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'payment_requested', 'paid', 'confirmed', 'cancelled', 'expired')),
  payment_hash TEXT,
  preimage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (status = 'cancelled');
```

- [ ] **Step 2: Create reservation hooks**

```typescript
// src/domains/reservations/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

import type { ReservationCreateInput } from "./types";

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReservationCreateInput) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          ...input,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: ["reservations", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, campings(name, province)")
        .order("check_in", { ascending: true })
        .throwOnError();

      if (error) throw error;
      return data;
    },
  });
}
```

- [ ] **Step 3: Build DateRangePicker, GuestCounter, BookingSummary components**

Simple NativeWind components. DateRangePicker with check-in/check-out date inputs. GuestCounter with +/- buttons. BookingSummary showing dates, guests, and price calculation.

- [ ] **Step 4: Replace reserve.tsx placeholder**

Wire the components into the reservation screen with `useCreateReservation()` mutation and a "Reservar" button.

- [ ] **Step 5: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(reservations): implement reservation flow with date picker and booking summary"
```

---

### Task 13: Owner Lightning Address (#35)

**Goal:** Allow camping owners to register a Lightning address for receiving payments.

**Branch:** `feat/35-owner-lightning`
**Depends on:** Task 6 (owner) merged into main

**Files:**
- Create: `supabase/migrations/20260328040000_owner_lightning.sql`
- Create: `src/domains/camping/components/OwnerSettingsScreen.tsx`
- Create: `src/domains/camping/useOwnerSettings.ts`

**GitHub Issue:** Read #35 via `gh issue view 35 --json body`.

- [ ] **Step 1: Create migration for Lightning address**

```sql
-- supabase/migrations/20260328040000_owner_lightning.sql
-- owner_lightning_address column already exists on campings table
-- Add validation function
CREATE OR REPLACE FUNCTION set_owner_lightning_address(
  p_camping_id UUID,
  p_address TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE campings
  SET owner_lightning_address = p_address, updated_at = NOW()
  WHERE id = p_camping_id
    AND owner_npub IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Create owner settings hooks and screen**

Hook: `useSetLightningAddress()` mutation calling the RPC. Screen: text input for Lightning address (format: `user@domain.com`), save button, validation.

- [ ] **Step 3: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(camping): allow owners to register Lightning address"
```

---

### Task 14: Dashboard Analytics (#40)

**Goal:** Build an owner analytics dashboard showing views, favorites, and reservation stats.

**Branch:** `feat/40-analytics-dashboard`
**Depends on:** Task 6 (owner) merged into main

**Files:**
- Create: `supabase/migrations/20260328030000_analytics.sql`
- Create: `src/domains/camping/components/OwnerDashboard.tsx`
- Create: `src/domains/camping/components/StatCard.tsx`
- Create: `src/domains/camping/useAnalytics.ts`

**GitHub Issue:** Read #40 via `gh issue view 40 --json body`.

- [ ] **Step 1: Create analytics migration**

```sql
-- supabase/migrations/20260328030000_analytics.sql
CREATE TABLE IF NOT EXISTS camping_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  camping_id UUID NOT NULL REFERENCES campings(id),
  viewer_id UUID,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_camping ON camping_views(camping_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON camping_views(viewed_at);

ALTER TABLE camping_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log views" ON camping_views
  FOR INSERT WITH CHECK (true);

-- Aggregation RPC
CREATE OR REPLACE FUNCTION get_camping_analytics(p_camping_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_views', (SELECT count(*) FROM camping_views WHERE camping_id = p_camping_id AND viewed_at > NOW() - (p_days || ' days')::INTERVAL),
    'total_favorites', (SELECT count(*) FROM favorites WHERE camping_id = p_camping_id),
    'total_reservations', (SELECT count(*) FROM reservations WHERE camping_id = p_camping_id AND created_at > NOW() - (p_days || ' days')::INTERVAL),
    'views_by_day', (
      SELECT json_agg(json_build_object('date', d, 'count', c))
      FROM (
        SELECT date_trunc('day', viewed_at) AS d, count(*) AS c
        FROM camping_views
        WHERE camping_id = p_camping_id AND viewed_at > NOW() - (p_days || ' days')::INTERVAL
        GROUP BY 1 ORDER BY 1
      ) sub
    )
  );
$$ LANGUAGE sql STABLE;
```

- [ ] **Step 2: Create analytics hooks**

Query calling `get_camping_analytics` RPC.

- [ ] **Step 3: Build StatCard and OwnerDashboard components**

StatCard: GlassView card showing metric label + value. OwnerDashboard: grid of StatCards (views, favorites, reservations) + simple bar chart for views over time.

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(camping): add owner analytics dashboard with views, favorites, and reservation stats"
```

---

## Wave 1 Review Checkpoint

- [ ] **Review all 5 branches**
- [ ] **Merge into main** in order: Favorites (#14), Submission (#16), Reservation (#32), Owner LN (#35), Analytics (#40)
- [ ] **Run typecheck** on main

---

## Wave 2 — NDK Unlocked (5 parallel agents, 10 issues)

Launch after Task 3 (NDK) is merged into main.

---

### Task 15: Nostr Identity — Profile + NIP-46 (#18 + #26)

**Goal:** Create/edit Nostr profile (kind:0), and support importing existing Nostr identity via NIP-46 remote signer.

**Branch:** `feat/18-26-nostr-identity`
**Depends on:** Task 3 (NDK) merged into main

**Files:**
- Create: `src/domains/identity/useNostrProfile.ts`
- Create: `src/domains/identity/useNIP46.ts`
- Create: `src/domains/identity/components/EditProfileSheet.tsx`
- Create: `src/domains/identity/components/ImportIdentitySheet.tsx`
- Modify: `src/domains/identity/types.ts` (add profile fields)

**GitHub Issues:** Read #18 and #26 via `gh issue view`.

- [ ] **Step 1: Create profile hooks**

```typescript
// src/domains/identity/useNostrProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk-mobile";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

export function useNostrProfile(npub?: string) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["nostr-profile", npub],
    queryFn: async () => {
      if (!ndk || !npub) return null;
      const user = new NDKUser({ npub });
      user.ndk = ndk;
      await user.fetchProfile();
      return user.profile;
    },
    enabled: !!ndk && !!npub,
  });
}

export function useUpdateProfile() {
  const { ndk } = useNDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      name?: string;
      about?: string;
      picture?: string;
      lud16?: string;
      nip05?: string;
    }) => {
      if (!ndk) throw new Error("NDK not ready");

      const event = new NDKEvent(ndk);
      event.kind = NOSTR_KINDS.METADATA;
      event.content = JSON.stringify(profile);
      await event.publish();
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nostr-profile"] });
    },
  });
}
```

- [ ] **Step 2: Create NIP-46 import hook**

```typescript
// src/domains/identity/useNIP46.ts
import { useState, useCallback } from "react";
import { NDKNip46Signer } from "@nostr-dev-kit/ndk-mobile";

import { getNDK } from "@/src/infrastructure/nostr/ndk";

export function useNIP46Import() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectRemoteSigner = useCallback(async (connectionString: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const ndk = getNDK();
      if (!ndk) throw new Error("NDK not initialized");

      const signer = new NDKNip46Signer(ndk, connectionString);
      await signer.blockUntilReady();

      ndk.signer = signer;
      const user = await signer.user();

      setIsConnecting(false);
      return { npub: user.npub, signer };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
      setIsConnecting(false);
      return null;
    }
  }, []);

  return { connectRemoteSigner, isConnecting, error };
}
```

- [ ] **Step 3: Build EditProfileSheet and ImportIdentitySheet**

EditProfileSheet: form with name, about, picture URL, Lightning address, NIP-05. Uses `useUpdateProfile()`.
ImportIdentitySheet: text input for NIP-46 connection string (bunker://...) or nsec import.

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(identity): add Nostr profile CRUD (kind:0) and NIP-46 remote signer import"
```

---

### Task 16: Social — Venues, Reviews, Check-ins, Feed (#19 + #20 + #22 + #23)

**Goal:** Publish camping venues on Nostr, implement review system with ratings, geolocated check-ins, and a social feed.

**Branch:** `feat/19-20-22-23-social`
**Depends on:** Task 3 (NDK) merged into main

**Files:**
- Create: `src/domains/social/hooks.ts`
- Create: `src/domains/social/useReviews.ts`
- Create: `src/domains/social/useCheckIns.ts`
- Create: `src/domains/social/useFeed.ts`
- Create: `src/domains/social/useVenuePublish.ts`
- Create: `src/domains/social/components/ReviewCard.tsx`
- Create: `src/domains/social/components/ReviewForm.tsx`
- Create: `src/domains/social/components/CheckInButton.tsx`
- Create: `src/domains/social/components/FeedItem.tsx`
- Create: `src/domains/social/components/StarRating.tsx`
- Modify: `app/(tabs)/social.tsx` (replace placeholder with feed)

**GitHub Issues:** Read #19, #20, #22, #23 via `gh issue view`.

- [ ] **Step 1: Create venue publishing hook**

```typescript
// src/domains/social/useVenuePublish.ts
import { useMutation } from "@tanstack/react-query";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";
import type { Camping } from "@/src/domains/camping/types";

export function usePublishVenue() {
  const { ndk } = useNDK();

  return useMutation({
    mutationFn: async (camping: Camping) => {
      if (!ndk) throw new Error("NDK not ready");

      const event = new NDKEvent(ndk);
      event.kind = NOSTR_KINDS.CAMPING_VENUE;
      event.content = JSON.stringify({
        name: camping.name,
        amenities: camping.amenities,
        prices: camping.prices,
        photos: camping.photos,
      });
      event.tags = [
        ["d", camping.slug],
        ["name", camping.name],
        ["g", camping.geohash],
        [
          "location",
          `${camping.latitude},${camping.longitude}`,
          camping.province,
        ],
        ["t", "camping"],
        ["t", "argentina"],
      ];

      await event.publish();
      return event;
    },
  });
}
```

- [ ] **Step 2: Create reviews hooks**

```typescript
// src/domains/social/useReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk-mobile";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

export function useReviews(campingSlug: string) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["reviews", campingSlug],
    queryFn: async () => {
      if (!ndk) return [];

      const filter: NDKFilter = {
        kinds: [NOSTR_KINDS.REVIEW as number],
        "#a": [`${NOSTR_KINDS.CAMPING_VENUE}:*:${campingSlug}`],
      };

      const events = await ndk.fetchEvents(filter);
      return Array.from(events).map((event) => ({
        id: event.id,
        author: event.pubkey,
        content: event.content,
        rating: Number(event.tagValue("rating") ?? 0),
        verifiedVisit: event.tagValue("verified") === "true",
        createdAt: event.created_at ?? 0,
      }));
    },
    enabled: !!ndk,
  });
}

export function usePublishReview() {
  const { ndk } = useNDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campingSlug,
      rating,
      content,
      verifiedVisit,
    }: {
      campingSlug: string;
      rating: number;
      content: string;
      verifiedVisit: boolean;
    }) => {
      if (!ndk) throw new Error("NDK not ready");

      const event = new NDKEvent(ndk);
      event.kind = NOSTR_KINDS.REVIEW;
      event.content = content;
      event.tags = [
        ["a", `${NOSTR_KINDS.CAMPING_VENUE}:${campingSlug}`],
        ["rating", String(rating)],
        ["verified", String(verifiedVisit)],
        ["t", "camping-review"],
      ];

      await event.publish();
      return event;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", vars.campingSlug],
      });
    },
  });
}
```

- [ ] **Step 3: Create check-in hooks**

Similar pattern to reviews using `NOSTR_KINDS.CHECK_IN` with geohash tags and GPS verification integration.

- [ ] **Step 4: Create feed hook**

```typescript
// src/domains/social/useFeed.ts
import { useQuery } from "@tanstack/react-query";
import type { NDKFilter } from "@nostr-dev-kit/ndk-mobile";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

export function useSocialFeed(geohashPrefix?: string) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["social-feed", geohashPrefix],
    queryFn: async () => {
      if (!ndk) return [];

      const filter: NDKFilter = {
        kinds: [
          NOSTR_KINDS.REVIEW as number,
          NOSTR_KINDS.CHECK_IN as number,
          NOSTR_KINDS.SHORT_TEXT_NOTE,
        ],
        "#t": ["camping", "camping-review"],
        limit: 50,
      };

      if (geohashPrefix) {
        filter["#g"] = [geohashPrefix];
      }

      const events = await ndk.fetchEvents(filter);
      return Array.from(events)
        .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
        .map((event) => ({
          id: event.id,
          kind: event.kind,
          author: event.pubkey,
          content: event.content,
          tags: event.tags,
          createdAt: event.created_at ?? 0,
        }));
    },
    enabled: !!ndk,
    refetchInterval: 60_000,
  });
}
```

- [ ] **Step 5: Build UI components**

StarRating (1-5 stars with lucide Star icons), ReviewCard (author, rating, content, verified badge), ReviewForm (star rating + text + submit), CheckInButton (uses GPS verification), FeedItem (renders review/check-in/note).

- [ ] **Step 6: Replace social.tsx placeholder with feed**

Wire `useSocialFeed()` into a FlatList of FeedItem components.

- [ ] **Step 7: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(social): implement venue publishing, reviews, check-ins, and social feed via Nostr"
```

---

### Task 17: Badges NIP-58 (#24)

**Goal:** Define badge types and implement badge award/display system using NIP-58.

**Branch:** `feat/24-badges`
**Depends on:** Task 3 (NDK) merged into main

**Files:**
- Create: `src/domains/social/badges/definitions.ts`
- Create: `src/domains/social/badges/useBadges.ts`
- Create: `src/domains/social/badges/BadgeDisplay.tsx`
- Create: `src/domains/social/badges/BadgeGrid.tsx`

**GitHub Issue:** Read #24 via `gh issue view 24 --json body`.

- [ ] **Step 1: Create badge definitions**

```typescript
// src/domains/social/badges/definitions.ts
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

export interface BadgeDefinition {
  name: string;
  description: string;
  image: string;
  criteria: string;
  dTag: string;
  kind: number;
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  EXPLORADOR_I: {
    name: "Explorador I",
    description: "Visitaste 5 campings",
    criteria: "5_campings_visited",
    dTag: "explorador-i",
    image: "🏕️",
    kind: NOSTR_KINDS.BADGE_DEFINITION,
  },
  EXPLORADOR_II: {
    name: "Explorador II",
    description: "Visitaste 20 campings",
    criteria: "20_campings_visited",
    dTag: "explorador-ii",
    image: "⛺",
    kind: NOSTR_KINDS.BADGE_DEFINITION,
  },
  PATAGONICO: {
    name: "Patagónico",
    description: "Completaste la ruta patagónica",
    criteria: "patagonia_route_complete",
    dTag: "patagonico",
    image: "🏔️",
    kind: NOSTR_KINDS.BADGE_DEFINITION,
  },
  CRITICO_DEL_FOGON: {
    name: "Crítico del Fogón",
    description: "Dejaste 10 reviews",
    criteria: "10_reviews",
    dTag: "critico-del-fogon",
    image: "🔥",
    kind: NOSTR_KINDS.BADGE_DEFINITION,
  },
  PIONERO: {
    name: "Pionero",
    description: "Uno de los primeros 500 usuarios",
    criteria: "first_500_users",
    dTag: "pionero",
    image: "⭐",
    kind: NOSTR_KINDS.BADGE_DEFINITION,
  },
};
```

- [ ] **Step 2: Create badge hooks**

```typescript
// src/domains/social/badges/useBadges.ts
import { useQuery } from "@tanstack/react-query";
import { NDKEvent, type NDKFilter } from "@nostr-dev-kit/ndk-mobile";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

import { BADGE_DEFINITIONS, type BadgeDefinition } from "./definitions";

export function useUserBadges(npub?: string) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["badges", npub],
    queryFn: async () => {
      if (!ndk || !npub) return [];

      const filter: NDKFilter = {
        kinds: [NOSTR_KINDS.PROFILE_BADGES as number],
        "#p": [npub],
        limit: 100,
      };

      const events = await ndk.fetchEvents(filter);
      const badgeDTags = Array.from(events).flatMap((e) =>
        e.tags.filter((t) => t[0] === "a").map((t) => t[1]?.split(":")[2]),
      );

      return Object.values(BADGE_DEFINITIONS).filter((b) =>
        badgeDTags.includes(b.dTag),
      );
    },
    enabled: !!ndk && !!npub,
  });
}

export function useAwardBadge() {
  const { ndk } = useNDK();

  return {
    award: async (npub: string, badge: BadgeDefinition) => {
      if (!ndk) throw new Error("NDK not ready");

      const event = new NDKEvent(ndk);
      event.kind = NOSTR_KINDS.BADGE_DEFINITION;
      event.content = "";
      event.tags = [
        ["d", badge.dTag],
        ["name", badge.name],
        ["description", badge.description],
        ["image", badge.image],
        ["p", npub],
      ];

      await event.publish();
      return event;
    },
  };
}
```

- [ ] **Step 3: Build BadgeDisplay and BadgeGrid**

BadgeDisplay: single badge card with image, name, description. BadgeGrid: grid of earned badges for a user profile.

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(social): implement NIP-58 badge definitions and award system"
```

---

### Task 18: NWC + Zaps (#31 + #34)

**Goal:** Integrate Nostr Wallet Connect via @getalby/sdk and implement zap buttons on reviews/posts (NIP-57).

**Branch:** `feat/31-34-nwc-zaps`
**Depends on:** Task 3 (NDK) merged into main

**Files:**
- Create: `src/infrastructure/wallet/nwc.ts`
- Create: `src/domains/payments/useNWC.ts`
- Create: `src/domains/payments/useZaps.ts`
- Create: `src/domains/payments/components/WalletConnectSheet.tsx`
- Create: `src/domains/payments/components/ZapButton.tsx`
- Create: `src/domains/payments/components/ZapModal.tsx`

**GitHub Issues:** Read #31 and #34 via `gh issue view`.

- [ ] **Step 1: Install @getalby/sdk**

```bash
npm install @getalby/sdk
```

- [ ] **Step 2: Create NWC client**

```typescript
// src/infrastructure/wallet/nwc.ts
import { NWCClient } from "@getalby/sdk";
import * as SecureStore from "expo-secure-store";

const NWC_URI_KEY = "nwc-connection-uri";

let nwcClient: NWCClient | null = null;

export async function connectWallet(uri: string): Promise<NWCClient> {
  nwcClient = new NWCClient({ nostrWalletConnectUrl: uri });
  const info = await nwcClient.getInfo();
  if (!info) throw new Error("Failed to connect wallet");

  await SecureStore.setItemAsync(NWC_URI_KEY, uri);
  return nwcClient;
}

export async function restoreWallet(): Promise<NWCClient | null> {
  const uri = await SecureStore.getItemAsync(NWC_URI_KEY);
  if (!uri) return null;

  try {
    nwcClient = new NWCClient({ nostrWalletConnectUrl: uri });
    return nwcClient;
  } catch {
    return null;
  }
}

export function getWalletClient(): NWCClient | null {
  return nwcClient;
}

export async function disconnectWallet(): Promise<void> {
  nwcClient = null;
  await SecureStore.deleteItemAsync(NWC_URI_KEY);
}

export async function getBalance(): Promise<number> {
  if (!nwcClient) throw new Error("Wallet not connected");
  const balance = await nwcClient.getBalance();
  return balance.balance;
}

export async function payInvoice(
  bolt11: string,
): Promise<{ preimage: string }> {
  if (!nwcClient) throw new Error("Wallet not connected");
  const result = await nwcClient.payInvoice({ invoice: bolt11 });
  return { preimage: result.preimage };
}

export async function makeInvoice(
  amountSats: number,
  description: string,
): Promise<string> {
  if (!nwcClient) throw new Error("Wallet not connected");
  const invoice = await nwcClient.makeInvoice({
    amount: amountSats * 1000, // millisats
    description,
  });
  return invoice.invoice;
}
```

- [ ] **Step 3: Create NWC hooks**

```typescript
// src/domains/payments/useNWC.ts
import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  connectWallet,
  disconnectWallet,
  getBalance,
  getWalletClient,
  restoreWallet,
} from "@/src/infrastructure/wallet/nwc";

export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    restoreWallet().then((client) => {
      setIsConnected(!!client);
    });
  }, []);

  const connect = useCallback(async (uri: string) => {
    await connectWallet(uri);
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setIsConnected(false);
  }, []);

  return { isConnected, connect, disconnect };
}

export function useWalletBalance() {
  return useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: getBalance,
    enabled: !!getWalletClient(),
    refetchInterval: 30_000,
  });
}
```

- [ ] **Step 4: Create zap hooks (NIP-57)**

```typescript
// src/domains/payments/useZaps.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NDKEvent, NDKUser, type NDKZapDetails } from "@nostr-dev-kit/ndk-mobile";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { payInvoice } from "@/src/infrastructure/wallet/nwc";

export function useZap() {
  const { ndk } = useNDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetEvent,
      amountSats,
      comment,
    }: {
      targetEvent: NDKEvent;
      amountSats: number;
      comment?: string;
    }) => {
      if (!ndk) throw new Error("NDK not ready");

      // Create zap request (NIP-57)
      const zapRequest = await targetEvent.zap(amountSats * 1000, comment);
      if (!zapRequest) throw new Error("Failed to create zap request");

      // Get invoice from target's LNURL
      const author = new NDKUser({ pubkey: targetEvent.pubkey });
      author.ndk = ndk;
      await author.fetchProfile();

      const lud16 = author.profile?.lud16;
      if (!lud16) throw new Error("El autor no tiene Lightning address");

      // Pay the invoice via NWC
      const result = await payInvoice(zapRequest);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });
}
```

- [ ] **Step 5: Build WalletConnectSheet, ZapButton, ZapModal**

WalletConnectSheet: QR scanner or paste NWC URI, connect/disconnect button, balance display.
ZapButton: Lightning bolt icon with optional amount badge.
ZapModal: amount selector (21, 210, 2100, 21000 sats), optional comment, confirm button.

- [ ] **Step 6: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(payments): integrate NWC wallet connect and NIP-57 zaps"
```

---

### Task 19: UGC Routes (#39)

**Goal:** Allow users to create, share, and view custom camping routes.

**Branch:** `feat/39-ugc-routes`
**Depends on:** Task 3 (NDK) merged into main

**Files:**
- Create: `src/domains/map/useUserRoutes.ts`
- Create: `src/domains/map/components/RouteCreator.tsx`
- Create: `src/domains/map/components/UserRouteCard.tsx`
- Create: `src/domains/map/utils/gpx-parser.ts`

**GitHub Issue:** Read #39 via `gh issue view 39 --json body`.

- [ ] **Step 1: Create GPX parser utility**

Simple parser for GPX XML → array of waypoints. Use DOMParser-like string parsing (no external deps).

- [ ] **Step 2: Create user routes hooks**

Publish routes as Nostr events (kind:30402 using NOSTR_KINDS.ROUTE). Fetch user routes from relay. Each route has name, description, campingIds as tags, waypoints as content.

- [ ] **Step 3: Build RouteCreator and UserRouteCard**

RouteCreator: form with name, description, select campings from a list, optional GPX import. UserRouteCard: display route with camping count, region, and share button.

- [ ] **Step 4: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(map): add user-generated camping routes with GPX import and Nostr sharing"
```

---

## Wave 2 Review Checkpoint

- [ ] **Review all 5 branches**
- [ ] **Merge into main** in order: Identity (#18+#26), Social (#19+#20+#22+#23), Badges (#24), NWC+Zaps (#31+#34), UGC (#39)
- [ ] **Run typecheck** on main

---

## Wave 3 — Final Features (2 parallel agents)

---

### Task 20: Profile with Badges (#25)

**Goal:** Build the full profile screen with badge grid, user stats, settings, and wallet section.

**Branch:** `feat/25-profile-screen`
**Depends on:** Task 17 (badges) merged into main

**Files:**
- Create: `src/domains/identity/components/ProfileHeader.tsx`
- Create: `src/domains/identity/components/ProfileStats.tsx`
- Create: `src/domains/identity/components/SettingsSection.tsx`
- Modify: `app/(tabs)/profile.tsx` (replace placeholder)

**GitHub Issue:** Read #25 via `gh issue view 25 --json body`.

- [ ] **Step 1: Build profile components**

ProfileHeader: avatar, display name, npub (truncated), about text, edit button.
ProfileStats: check-ins count, reviews count, routes created.
SettingsSection: dark mode toggle, sign out button, wallet connection status, Lightning address.

- [ ] **Step 2: Replace profile.tsx placeholder**

Wire all components with `useNostrProfile()`, `useUserBadges()`, `useAuthStore()`. Show BadgeGrid. Show favorites list via `useFavorites()`.

- [ ] **Step 3: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(identity): build full profile screen with badges, stats, and settings"
```

---

### Task 21: Payments — P2P, HODL, Subscriptions (#33 + #37 + #38)

**Goal:** Implement P2P Lightning payments for reservations, HODL invoices for multi-day stays, and Pro subscription system for owners.

**Branch:** `feat/33-37-38-payments`
**Depends on:** Task 18 (NWC) merged into main

**Files:**
- Create: `src/domains/payments/usePayment.ts`
- Create: `src/domains/payments/useSubscription.ts`
- Create: `src/domains/payments/components/PaymentSheet.tsx`
- Create: `src/domains/payments/components/SubscriptionCard.tsx`
- Create: `src/domains/payments/utils/lnurl.ts`
- Create: `supabase/migrations/20260328050000_subscriptions.sql`

**GitHub Issues:** Read #33, #37, #38 via `gh issue view`.

- [ ] **Step 1: Create LNURL utility**

```typescript
// src/domains/payments/utils/lnurl.ts
export async function fetchLNURLPayInfo(lud16: string) {
  const [name, domain] = lud16.split("@");
  if (!name || !domain) throw new Error("Invalid Lightning address");

  const url = `https://${domain}/.well-known/lnurlp/${name}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === "ERROR") throw new Error(data.reason);

  return {
    callback: data.callback as string,
    minSendable: (data.minSendable as number) / 1000, // to sats
    maxSendable: (data.maxSendable as number) / 1000,
    metadata: data.metadata as string,
    allowsNostr: data.allowsNostr as boolean,
    nostrPubkey: data.nostrPubkey as string | undefined,
  };
}

export async function requestInvoice(
  callback: string,
  amountSats: number,
  zapRequest?: string,
) {
  const params = new URLSearchParams({
    amount: String(amountSats * 1000),
  });
  if (zapRequest) params.set("nostr", zapRequest);

  const response = await fetch(`${callback}?${params}`);
  const data = await response.json();

  if (data.status === "ERROR") throw new Error(data.reason);
  return data.pr as string;
}
```

- [ ] **Step 2: Create payment hook**

```typescript
// src/domains/payments/usePayment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { payInvoice } from "@/src/infrastructure/wallet/nwc";

import { fetchLNURLPayInfo, requestInvoice } from "./utils/lnurl";

export function usePayCamping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lightningAddress,
      amountSats,
      reservationId,
    }: {
      lightningAddress: string;
      amountSats: number;
      reservationId: string;
    }) => {
      const payInfo = await fetchLNURLPayInfo(lightningAddress);

      if (amountSats < payInfo.minSendable || amountSats > payInfo.maxSendable) {
        throw new Error(
          `Monto fuera de rango: ${payInfo.minSendable}-${payInfo.maxSendable} sats`,
        );
      }

      const bolt11 = await requestInvoice(payInfo.callback, amountSats);
      const { preimage } = await payInvoice(bolt11);

      return { preimage, bolt11, reservationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}
```

- [ ] **Step 3: Create subscriptions migration**

```sql
-- supabase/migrations/20260328050000_subscriptions.sql
CREATE TABLE IF NOT EXISTS owner_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  camping_id UUID NOT NULL REFERENCES campings(id),
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'premium')),
  amount_sats BIGINT NOT NULL DEFAULT 0,
  payment_hash TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  UNIQUE(camping_id)
);

ALTER TABLE owner_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage subscriptions" ON owner_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id);
```

- [ ] **Step 4: Create subscription hook**

Query and mutation for owner subscriptions. Pro plan unlocks analytics dashboard and priority listing.

- [ ] **Step 5: Build PaymentSheet and SubscriptionCard**

PaymentSheet: shows amount in sats + ARS estimate, "Pagar con Lightning" button, payment status feedback.
SubscriptionCard: shows current plan, upgrade button, expiry date.

- [ ] **Step 6: Validate and commit**

```bash
npx tsc --noEmit
git add -A && git commit -m "feat(payments): implement P2P Lightning payments, HODL invoices, and Pro subscriptions"
```

---

## Wave 3 Review Checkpoint

- [ ] **Review both branches**
- [ ] **Merge into main** in order: Profile (#25), Payments (#33+#37+#38)
- [ ] **Run typecheck** on main

---

## Wave 4 — Integration (Main Orchestrator)

No agents. Execute in main session.

---

### Task 22: Integration and Wiring

**Goal:** Wire all providers in `_layout.tsx`, install all dependencies, resolve conflicts, verify navigation, update CLAUDE.md.

**Branch:** Direct on `main` (after all merges)

- [ ] **Step 1: Install all new dependencies**

```bash
npx expo install @react-native-community/netinfo react-native-get-random-values react-native-quick-crypto @nostr-dev-kit/ndk-mobile nostr-tools @getalby/sdk
```

- [ ] **Step 2: Add crypto polyfill as first import**

In `app/_layout.tsx`, add as the very first line:
```typescript
import "react-native-get-random-values";
```

- [ ] **Step 3: Wire providers in _layout.tsx**

Add `NDKProvider` and `useEnsureSession()` call. Add `useSyncCampingsToSQLite()` call. Add `usePushNotifications()` call. Import online/focus manager setup.

```typescript
import "react-native-get-random-values";
import "@/global.css";
import "@/src/infrastructure/mapbox/client";
import "@/src/infrastructure/tanstack/onlineManager";
import "@/src/infrastructure/tanstack/focusManager";
// ... rest of imports

import { NDKProvider } from "@/src/infrastructure/nostr/provider";
import { useEnsureSession } from "@/src/domains/identity/hooks";
import { useSyncCampingsToSQLite } from "@/src/domains/camping/useSyncCampings";
import { usePushNotifications } from "@/src/infrastructure/notifications/usePushNotifications";
```

Wrap the app:
```tsx
<NDKProvider>
  <PersistQueryClientProvider ...>
    <ThemeProvider ...>
      <AppContent />
    </ThemeProvider>
  </PersistQueryClientProvider>
</NDKProvider>
```

Where `AppContent` is a component that calls the hooks (hooks must be inside providers):
```tsx
function AppContent() {
  useEnsureSession();
  useSyncCampingsToSQLite();
  usePushNotifications();

  return <Stack>...</Stack>;
}
```

- [ ] **Step 4: Register new routes**

Add to Stack in _layout.tsx any new screens from the tasks.

- [ ] **Step 5: Run full typecheck**

```bash
npx tsc --noEmit
```

Fix any type errors from cross-workstream integration.

- [ ] **Step 6: Update CLAUDE.md**

Update architecture section, stack, key patterns, and phases to reflect all new code.

- [ ] **Step 7: Final commit**

```bash
git add -A && git commit -m "feat: wire all Fase 1/2/3 providers and complete integration"
```

---

## Summary

| Wave | Tasks | Issues | Parallel Agents |
|------|-------|--------|-----------------|
| 0 | 1-9 | #11,#12,#13,#15,#17,#21,#27,#28,#29,#30,#36 | 9 |
| 1 | 10-14 | #14,#16,#32,#35,#40 | 5 |
| 2 | 15-19 | #18,#19,#20,#22,#23,#24,#26,#31,#34,#39 | 5 |
| 3 | 20-21 | #25,#33,#37,#38 | 2 |
| 4 | 22 | Integration | 0 (main) |
| **Total** | **22 tasks** | **30 issues** | **21 agents** |
