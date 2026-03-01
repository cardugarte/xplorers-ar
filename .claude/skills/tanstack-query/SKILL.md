---
name: tanstack-query
description: >
  TanStack Query v5 patterns for React Native + Supabase.
  Trigger: When writing data fetching hooks, mutations, cache invalidation.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## Query Options Factory (v5 Pattern)

```typescript
import { queryOptions } from "@tanstack/react-query";

// ✅ Co-locate queryKey + queryFn (recommended in v5)
const campingQueries = {
  all: () => ["campings"] as const,
  lists: () => [...campingQueries.all(), "list"] as const,
  list: (filters: CampingFilters) =>
    queryOptions({
      queryKey: [...campingQueries.lists(), filters],
      queryFn: () => fetchCampings(filters),
    }),
  details: () => [...campingQueries.all(), "detail"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...campingQueries.details(), id],
      queryFn: () => fetchCamping(id),
    }),
};

// Usage in hooks
function useCamping(id: string) {
  return useQuery({ ...campingQueries.detail(id), enabled: !!id });
}

// Invalidation — prefix matching
queryClient.invalidateQueries({ queryKey: campingQueries.all() });
```

## Supabase queryFn: Always throwOnError (REQUIRED)

```typescript
// ❌ BAD: Supabase errors go to { error } object, TanStack never sees them
const { data, error } = await supabase.from("campings").select("*");
if (error) throw error;  // manual throw needed

// ✅ GOOD: throwOnError() makes Supabase throw on errors
const { data } = await supabase
  .from("campings")
  .select("*")
  .throwOnError();
return data;

// ✅ RPC calls
const { data } = await supabase
  .rpc("get_campings_near", { lat, lng, radius_km: radiusKm, lim: 100 })
  .throwOnError();
return data;
```

## v5 Breaking Changes (REQUIRED)

```typescript
// ✅ Single object parameter (v4 positional args removed)
useQuery({ queryKey: ["key"], queryFn: fetchFn, staleTime: 5000 });

// ❌ v4 style removed
useQuery(["key"], fetchFn, { staleTime: 5000 });

// ✅ isPending replaces isLoading for "no data yet"
const { data, isPending, isFetching, error } = useQuery(...);
// isPending = no cached data
// isFetching = network request in flight
// isPending && isFetching = first load (show spinner)
// !isPending && isFetching = background refetch (show stale data)

// ❌ onSuccess/onError REMOVED from useQuery in v5
// Use useEffect for side effects, or global QueryCache callbacks

// ✅ keepPreviousData replaced
import { keepPreviousData } from "@tanstack/react-query";
useQuery({ queryKey, queryFn, placeholderData: keepPreviousData });
```

## Mutation With Invalidation

```typescript
function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campingId, userId }: { campingId: string; userId: string }) =>
      supabase
        .from("favorites")
        .insert({ camping_id: campingId, user_id: userId })
        .throwOnError(),
    onSuccess: async (_data, variables) => {
      // Returning Promise keeps isPending true until invalidation completes
      await queryClient.invalidateQueries({ queryKey: ["favorites", variables.userId] });
    },
  });
}
```

## Optimistic Update (Via Cache)

```typescript
useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ["favorites"] });
    const previous = queryClient.getQueryData(["favorites"]);
    queryClient.setQueryData(["favorites"], (old) => /* optimistic update */);
    return { previous };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(["favorites"], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["favorites"] });
  },
});
```

## select for Derived Data

```typescript
// select only runs when data changes (stable reference)
useQuery({
  ...campingQueries.list(filters),
  select: (data) => data.filter((c) => c.type === "glamping"),
});
```

## React Native: Focus & Network Setup

```typescript
// App state → focus manager (refetch on app foreground)
import { AppState, Platform } from "react-native";
import { focusManager } from "@tanstack/react-query";

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

// Screen focus → refetch active queries
import { useFocusEffect } from "@react-navigation/native";

// subscribed prop (v5): unsubscribe when screen not focused
import { useIsFocused } from "@react-navigation/native";
useQuery({ queryKey, queryFn, subscribed: useIsFocused() });
```

## Project QueryClient Config

```typescript
// staleTime: 15min — camping data doesn't change often
// gcTime: 24h — keep in memory for offline browsing
// retry: 2 — mobile connections are spotty
// refetchOnWindowFocus: false — use focusManager instead
```

## MMKV Persistence (Packages Installed, Not Wired Yet)

```typescript
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

const persister = createSyncStoragePersister({
  storage: mmkvStorageAdapter,
  key: "XPLORERS_QUERY_CACHE",
});

// maxAge must match or exceed gcTime (24h)
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
>
```

## Global Error Handling

```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Show toast only for background refetch failures
      if (query.state.data !== undefined) {
        toast.error(`Error: ${error.message}`);
      }
    },
  }),
});
```

## Keywords
tanstack query, react query, useQuery, useMutation, cache, invalidation, supabase, offline
