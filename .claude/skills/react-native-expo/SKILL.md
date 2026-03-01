---
name: react-native-expo
description: >
  React Native 0.83 + Expo SDK 55 patterns.
  Trigger: When writing RN components - platform differences from web, lists, navigation, storage.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## No HTML Primitives (REQUIRED)

```tsx
// ✅ React Native components
import { View, Text, Pressable, Image, TextInput, ScrollView } from "react-native";

<View>           {/* div */}
  <Text>Hello</Text>  {/* p, span, h1 — ALL text MUST be in <Text> */}
</View>

// ❌ CRASH: bare text outside <Text>
<View>Hello world</View>

// ❌ CRASH: falsy number renders as native view
{count && <Text>{count}</Text>}

// ✅ Safe conditional render
{count > 0 ? <Text>{count}</Text> : null}
{!!count && <Text>{count}</Text>}
```

## Flexbox Defaults Differ From Web

```tsx
// RN defaults (different from web):
// flexDirection: 'column'   (web: 'row')
// flexShrink: 0             (web: 1)
// alignContent: 'flex-start' (web: 'stretch')
// flex accepts single number only (not shorthand)
// Units: dp only — no px, em, rem, vh, vw
```

## Lists — FlatList, Not map() (REQUIRED)

```tsx
// ❌ BAD: renders ALL items, no virtualization, kills memory
<ScrollView>
  {items.map(item => <Card key={item.id} item={item} />)}
</ScrollView>

// ✅ GOOD: only renders visible items
<FlatList
  data={items}
  renderItem={({ item }) => <Card item={item} />}
  keyExtractor={item => item.id}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>

// ❌ BAD: FlatList inside ScrollView breaks virtualization
<ScrollView>
  <Header />
  <FlatList data={items} />
</ScrollView>

// ✅ GOOD: use ListHeaderComponent
<FlatList
  data={items}
  ListHeaderComponent={<Header />}
  renderItem={renderItem}
/>
```

## Images Must Have Explicit Dimensions

```tsx
// ✅ Always specify width/height — images have no intrinsic size in RN
<Image source={{ uri: "https://..." }} style={{ width: 200, height: 200 }} />
<Image source={require("./image.png")} style={{ width: 100, height: 100 }} />

// Production: prefer expo-image for caching + progressive loading
```

## Platform-Specific Code

```tsx
import { Platform } from "react-native";

// Inline check
const padding = Platform.OS === "ios" ? 20 : 16;

// Platform.select for style objects
const shadow = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25 },
  android: { elevation: 4 },
});

// File extensions: Component.ios.tsx / Component.android.tsx
// Metro resolves automatically. Import as ./Component
```

## Safe Areas (REQUIRED for screens)

```tsx
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ Wrap screen content to avoid notch/status bar/home indicator
<SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
  <Text>Safe content</Text>
</SafeAreaView>

// SDK 55: edge-to-edge mandatory on Android 16+
```

## Keyboard Handling

```tsx
import { KeyboardAvoidingView, Platform } from "react-native";

<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
  <TextInput />
</KeyboardAvoidingView>
```

## No Web Storage APIs

```
localStorage    → MMKV (sync) or AsyncStorage (async)
sessionStorage  → Zustand (in-memory)
cookies         → N/A
secure storage  → expo-secure-store
SQLite          → expo-sqlite
```

## New Architecture (Enabled in This Project)

- Fabric renderer: concurrent rendering, synchronous layout measurement
- TurboModules: lazy-loaded native modules via JSI (no JSON bridge)
- `useLayoutEffect` works correctly (synchronous)
- Third-party libs may need New Architecture compatible versions

## Expo SDK 55 Notes

- React Native 0.83, React 19.2
- `newArchEnabled` config option removed — New Architecture is the only path
- expo-blur: `experimentalBlurMethod` renamed to `blurMethod`
- `removeSubscription()` deprecated — use `subscription.remove()` pattern
- All Expo packages use same major version as SDK (e.g., `expo-camera@^55`)

## Keywords
react native, expo, sdk 55, rn, mobile, platform, flatlist, safe area, keyboard
