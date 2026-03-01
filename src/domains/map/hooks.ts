import type { MapState } from "@rnmapbox/maps";
import { useCallback, useState } from "react";

import { toViewportBounds, type ViewportBounds } from "./types";

export function useViewportBounds() {
  const [bounds, setBounds] = useState<ViewportBounds | null>(null);

  const handleMapIdle = useCallback((state: MapState) => {
    const { ne, sw } = state.properties.bounds;
    setBounds(
      toViewportBounds(
        ne as [number, number],
        sw as [number, number],
      ),
    );
  }, []);

  return { bounds, handleMapIdle } as const;
}
