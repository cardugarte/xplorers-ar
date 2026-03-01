---
name: nativewind
description: >
  NativeWind v4 + Tailwind CSS v3 for React Native.
  Trigger: When styling RN components - className, dark mode, platform modifiers.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## className on RN Components (REQUIRED)

```tsx
// ✅ className works on core RN components via jsxImportSource
import { View, Text, Pressable } from "react-native";

<View className="flex-1 items-center justify-center bg-white dark:bg-[#1e2730]">
  <Text className="font-heading text-2xl text-andes-800 dark:text-andes-300">
    Hello
  </Text>
</View>

// ❌ NEVER use StyleSheet.create for things Tailwind can handle
const styles = StyleSheet.create({ container: { flex: 1 } });
```

## Native Views: Use style, Not className (REQUIRED)

```tsx
// ✅ Third-party native views (MapView, BlurView, etc.) need style prop
<MapboxGL.MapView style={{ flex: 1 }} />

// ❌ className won't propagate to native views from third-party libs
<MapboxGL.MapView className="flex-1" />
```

## Color Does NOT Cascade on View

```tsx
// ❌ BAD: color won't reach Text children on native
<View className="text-red-500">
  <Text>NOT red on native</Text>
</View>

// ✅ GOOD: apply color directly on Text
<View>
  <Text className="text-red-500">IS red</Text>
</View>
```

## Always Declare Both Light AND Dark Styles

```tsx
// ❌ BAD: only dark mode, light mode gets undefined
<Text className="dark:text-white" />

// ✅ GOOD: both modes explicit
<Text className="text-black dark:text-white" />
```

## Shadows Require Background Color

```tsx
// ❌ BAD: shadow invisible on native without bg
<View className="shadow-lg" />

// ✅ GOOD: shadow renders
<View className="shadow-lg bg-white dark:bg-[#1e2730]" />
```

## Platform Modifiers

```tsx
<View className="native:bg-red-200 ios:bg-blue-200 android:bg-green-200 web:bg-purple-200" />

// native: = all platforms except web
```

## Pseudo-Classes Need Component Support

```tsx
// hover: → needs onHoverIn/onHoverOut (Pressable, TextInput only)
// active: → needs onPressIn/onPressOut (Pressable only)
// focus: → needs onFocus/onBlur (TextInput only)
// ❌ View and Text do NOT support hover/active

<Pressable className="bg-white active:bg-gray-100">
  <Text>Press me</Text>
</Pressable>
```

## FlatList / ScrollView Styling

```tsx
// ✅ Use contentContainerClassName for inner container
<FlatList
  className="flex-1"
  contentContainerClassName="p-4"
  data={items}
  renderItem={renderItem}
/>

// ⚠️ gap, items-center, justify-center may NOT work in contentContainerClassName
// Fall back to contentContainerStyle for those
```

## style Merges With className

```tsx
// style takes precedence over className
<Text className="text-white" style={{ color: "black" }} />
// Result: black text

// !important overrides everything
<Text className="!text-red-500" style={{ color: "green" }} />
// Result: red text
```

## Custom Project Classes

```tsx
// Font families (from tailwind.config.js)
<Text className="font-heading" />     {/* BarlowCondensed */}
<Text className="font-body" />        {/* DMSans */}
<Text className="font-label" />       {/* BarlowSemiCondensed */}
<Text className="font-display" />     {/* InstrumentSerif */}

// Color scales
<Text className="text-andes-500" />       {/* brand green */}
<Text className="text-glaciar-400" />     {/* blue */}
<Text className="text-crepusculo-500" />  {/* accent orange */}

// Border radius
<View className="rounded-glass" />     {/* 20px */}
<View className="rounded-glass-sm" />  {/* 14px */}
<View className="rounded-glass-xs" />  {/* 10px */}
```

## Safe Area Utilities

```tsx
// NativeWind provides -safe suffix (requires SafeAreaProvider)
<View className="pt-safe pb-safe" />
<View className="h-screen-safe" />
```

## rem = 14px on Native

NativeWind inlines rem values at build time. Default rem is **14px on native** (16px on web). Tailwind spacing values are slightly smaller on native.

## Group/Parent State

```tsx
<Pressable className="group/card">
  <View className="group-active/card:bg-blue-100">
    <Text className="group-active/card:text-blue-700">
      Styles change on parent press
    </Text>
  </View>
</Pressable>
```

## Cache Issues

If styles don't apply after changes: `npx expo start --clear`

## Keywords
nativewind, tailwind, className, styling, dark mode, platform, css, rn styles
