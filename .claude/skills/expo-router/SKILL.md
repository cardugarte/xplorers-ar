---
name: expo-router
description: >
  Expo Router v4 file-based routing patterns.
  Trigger: When working with navigation, routes, tabs, layouts, deep linking.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## File-Based Routing

```
app/
├── _layout.tsx            # Root layout (Stack + providers)
├── +not-found.tsx         # 404 handler
├── (auth)/                # Group: no URL segment
│   └── onboarding.tsx     # → /onboarding
├── (tabs)/
│   ├── _layout.tsx        # Tabs layout
│   ├── index.tsx          # → / (default tab)
│   ├── map.tsx            # → /map
│   └── profile.tsx        # → /profile
└── camping/
    └── [id]/
        ├── index.tsx      # → /camping/123
        └── reserve.tsx    # → /camping/123/reserve
```

- Every file with default export in `app/` = route
- `(parentheses)` = group, organizes without affecting URL
- `[brackets]` = dynamic segment
- `[...slug]` = catch-all (returns string array)
- `_layout.tsx` = layout wrapper for directory
- `+not-found.tsx` = unmatched routes

## Routes Are Thin Shells (REQUIRED)

```tsx
// ✅ app/(tabs)/map.tsx — delegates to domain component
import { MapScreen } from "@/src/domains/map/components/MapScreen";
export default MapScreen;

// ❌ BAD: business logic in route files
export default function MapScreen() {
  const [data, setData] = useState([]); // NO logic here
}
```

## Layout Files

```tsx
// app/_layout.tsx — Root: providers + Stack
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="camping/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </Providers>
  );
}

// unstable_settings for initial route
export const unstable_settings = {
  initialRouteName: "(tabs)",
};
```

## Tab Layout

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2d8653" }}>
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => <MapIcon color={color} />,
        }}
      />
      {/* href: null hides tab from bar without removing route */}
      <Tabs.Screen name="hidden" options={{ href: null }} />
    </Tabs>
  );
}
```

## Navigation

```tsx
import { Link, router } from "expo-router";

// Declarative
<Link href="/camping/abc-123">Ver camping</Link>
<Link href={{ pathname: "/camping/[id]", params: { id } }}>Ver</Link>

// Imperative
router.push("/camping/abc-123");      // push onto stack
router.navigate("/camping/abc-123");  // push or unwind to existing
router.replace("/profile");           // replace current
router.back();                        // go back
router.dismiss();                     // dismiss modal
router.dismissAll();                  // dismiss all modals
```

## Typed Routes

Enabled via `app.json` → `experiments.typedRoutes: true`. Types auto-generated on dev server start.

```tsx
// ✅ Type-checked paths
<Link href="/about" />
router.push("/camping/123");

// ❌ TypeScript error
<Link href="/abut" />

// Dynamic routes require object syntax
<Link href={{ pathname: "/camping/[id]", params: { id: "123" } }} />
```

## Hooks

```tsx
import {
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
  useSegments,
  usePathname,
} from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

// Route params (focused route only, stable for background screens)
const { id } = useLocalSearchParams<{ id: string }>();

// Global params (updates even when unfocused — use cautiously)
const { id } = useGlobalSearchParams();

// Current segments
const segments = useSegments(); // ["(tabs)", "map"]

// Focus effect (runs on focus, cleanup on unfocus)
useFocusEffect(
  useCallback(() => {
    fetchData();
    return () => cleanup();
  }, [])
);
```

## Protected Routes (SDK 53+)

```tsx
<Stack>
  <Stack.Protected guard={isLoggedIn}>
    <Stack.Screen name="(tabs)" />
  </Stack.Protected>
  <Stack.Protected guard={!isLoggedIn}>
    <Stack.Screen name="sign-in" />
  </Stack.Protected>
</Stack>
```

## Deep Linking

Automatic from file structure. Scheme configured in `app.json`:
- `app/(tabs)/map.tsx` → `xplorers://map`
- `app/camping/[id]/index.tsx` → `xplorers://camping/123`

Set `initialRouteName` in `unstable_settings` so deep links have proper back navigation.

## Keywords
expo router, routing, navigation, tabs, stack, layout, deep linking, typed routes
