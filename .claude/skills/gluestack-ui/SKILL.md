# Gluestack UI v3 — Xplorers Patterns

Installed packages: `@gluestack-ui/overlay@^0.1.22`, `@gluestack-ui/toast@^1.0.9`, `@gluestack-ui/nativewind-utils@^1.0.28`.

## tva — Tailwind Variants Abstraction

From `@gluestack-ui/nativewind-utils/tva`. Wraps `tailwind-variants` `tv()` with NativeWind support and parent variant merging.

### API

```tsx
import { tva } from "@gluestack-ui/nativewind-utils/tva";

const chipStyle = tva({
  base: "rounded-glass-xs px-3 py-1.5 font-label text-sm",
  variants: {
    variant: {
      active: "bg-andes-200 dark:bg-andes-700",
      inactive: "bg-transparent",
    },
    size: {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1.5 text-sm",
      lg: "px-4 py-2 text-base",
    },
  },
  defaultVariants: {
    variant: "inactive",
    size: "md",
  },
});

// Usage
<View className={chipStyle({ variant: "active", size: "sm" })} />
```

### Key differences from `cva`

- Supports `parentVariants` / `parentCompoundVariants` for component composition
- Deep-merges parent + child variants automatically
- Same slot/compound variant API as `tailwind-variants`
- Config defaults from `tailwind-variants` `defaultConfig`

### With GlassView levels

```tsx
const glassCardStyle = tva({
  base: "rounded-glass p-4",
  variants: {
    level: {
      ultra: "", // glass level handled by GlassView prop, not className
      mid: "",
      soft: "",
      andes: "",
    },
    elevated: {
      true: "shadow-md",
      false: "",
    },
  },
  defaultVariants: { level: "mid", elevated: false },
});
```

> Note: GlassView applies glass styles via `ViewStyle` (not className). Use `tva` for className-based variants (size, spacing, layout) and GlassView `level` prop for the glass effect.

---

## Toast System

From `@gluestack-ui/toast`. Factory pattern for creating toasts.

### Setup

#### 1. Create toast components

```tsx
// src/shared/components/toast.tsx
import { createToast, createToastHook } from "@gluestack-ui/toast";
import { Text, View } from "react-native";
import { Motion, AnimatePresence } from "@legendapp/motion"; // or Animated wrapper

import { GlassView } from "@/src/shared/components/GlassView";

// Create the hook (animation wrapper can be a simple View if no animations)
export const useToast = createToastHook(Motion.View, AnimatePresence);
// Or without animations:
// export const useToast = createToastHook(View, ({ children }: any) => <>{children}</>);

// Create styled toast
export const Toast = createToast({
  Root: GlassView,   // Use GlassView as toast container
  Title: Text,
  Description: Text,
});
```

#### 2. Add ToastProvider to root layout

```tsx
// app/_layout.tsx
import { ToastProvider } from "@gluestack-ui/toast";

export default function RootLayout() {
  return (
    <ToastProvider>
      {/* ...existing providers and Slot/Stack */}
    </ToastProvider>
  );
}
```

### Usage

```tsx
const toast = useToast();

toast.show({
  placement: "bottom",        // "top" | "bottom" | "top right" | "top left" | "bottom left" | "bottom right"
  duration: 3000,             // ms, null = never dismiss
  avoidKeyboard: true,
  render: ({ id }) => (
    <Toast nativeID={`toast-${id}`} level="andes" className="mx-4 rounded-glass p-4">
      <Toast.Title className="font-heading text-sm text-andes-800 dark:text-andes-100">
        Guardado
      </Toast.Title>
      <Toast.Description className="font-body text-xs text-andes-700 dark:text-andes-200">
        El camping fue agregado a favoritos
      </Toast.Description>
    </Toast>
  ),
});

// Other methods
toast.close(id);       // dismiss specific toast
toast.closeAll();      // dismiss all
toast.isActive(id);    // check if visible
```

### Toast types by glass level

| Intent    | Glass level   | Example                          |
|-----------|---------------|----------------------------------|
| Success   | `andes`       | "Guardado", "Favorito agregado"  |
| Info      | `glaciar`     | "Sincronizando...", "Actualizado"|
| Warning   | `crepusculo`  | "Sin conexión", "Límite cercano" |
| Neutral   | `mid`         | Generic feedback                 |

---

## Overlay

From `@gluestack-ui/overlay`. For partial overlays (tooltips, popovers, dropdowns). NOT for full-screen modals.

### Setup

```tsx
// app/_layout.tsx
import { OverlayProvider } from "@gluestack-ui/overlay";

export default function RootLayout() {
  return (
    <OverlayProvider>
      {/* ...existing providers */}
    </OverlayProvider>
  );
}
```

### API

```tsx
import { Overlay } from "@gluestack-ui/overlay";

<Overlay
  isOpen={isVisible}
  onRequestClose={onClose}
  animationPreset="fade"           // "fade" | "slide" | "none"
  useRNModal={false}               // true = uses RN Modal (better a11y on Android)
  isKeyboardDismissable={true}     // ESC / back button dismisses
>
  {/* Overlay content */}
</Overlay>
```

### When to use Overlay vs Modal

| Use case                        | Component                                      |
|---------------------------------|------------------------------------------------|
| Full-screen sheet / form        | RN `Modal` + `presentationStyle="pageSheet"`   |
| Filter/sort panel               | RN `Modal` (see FilterModal.tsx pattern)        |
| Image gallery viewer            | RN `Modal` + `presentationStyle="overFullScreen"` |
| Tooltip / popover               | Gluestack `Overlay`                            |
| Dropdown menu                   | Gluestack `Overlay`                            |
| Confirmation dialog (small)     | Gluestack `Overlay` + `useRNModal` on Android  |

---

## Project Modal Pattern (established)

The project uses RN `Modal` directly with `GlassView` for full-screen modals. This is the canonical pattern — do NOT replace it with Gluestack Overlay for full modals.

### Reference: `src/domains/camping/components/FilterModal.tsx`

```tsx
import { Modal, Pressable, ScrollView, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ExampleModal({ visible, onClose }: ModalProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"     // iOS sheet presentation
      onRequestClose={onClose}          // Android back button
    >
      <View
        className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
        style={{ paddingTop: insets.top }}
      >
        {/* Header: title + close button */}
        {/* Content: ScrollView */}
        {/* Footer: action buttons with insets.bottom padding */}
      </View>
    </Modal>
  );
}
```

### Key conventions

- `presentationStyle="pageSheet"` for iOS native sheet behavior
- `onRequestClose` always wired for Android back button
- `useSafeAreaInsets()` for top/bottom padding
- Background: `bg-[#fafbfc] dark:bg-[#1e2730]` (semantic.light/dark.bg.base)
- Text colors via `glassText.dark/light` for WCAG AA contrast
- Close button: icon in rounded muted background
- GlassView chips for interactive elements (filters, tags)

---

## Reference Files

- `src/shared/components/GlassView.tsx` — reusable glass component (blur + opaque fallback)
- `src/shared/theme/glass.ts` — 7 glass presets: ultra, mid, soft, andes, glaciar, crepusculo, btn
- `src/shared/theme/tokens.ts` — color scales, semantic values, glassText (WCAG AA)
- `src/domains/camping/components/FilterModal.tsx` — canonical modal pattern
