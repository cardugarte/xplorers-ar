/**
 * NDKProvider — initializes the NDK singleton and exposes it via React context.
 *
 * Uses the NDK Mobile hooks (useNDKInit) to register the singleton instance
 * with the React hook layer. Also sets up the NDK session monitor with
 * SecureStore-backed persistence.
 *
 * Usage in app/_layout.tsx:
 *   import { NDKProvider } from "@/src/infrastructure/nostr/provider";
 *   <NDKProvider>
 *     <Stack />
 *   </NDKProvider>
 */
import { useEffect, useRef, type ReactNode } from "react";
import {
  useNDKInit,
  NDKSessionExpoSecureStore,
  useSessionMonitor,
} from "@nostr-dev-kit/mobile";

import { initNDK, restoreKeypair } from "./ndk";

interface NDKProviderProps {
  children: ReactNode;
}

/**
 * Headless component that initializes NDK and monitors sessions.
 * Renders nothing — all state is managed via NDK's internal Zustand stores.
 */
function NDKHeadless() {
  const initializeNDK = useNDKInit();
  const sessionStorage = useRef(new NDKSessionExpoSecureStore());

  // Monitor session state and persist to SecureStore
  useSessionMonitor({ profile: true, follows: true });

  useEffect(() => {
    async function bootstrap() {
      // Try to restore existing keypair from SecureStore
      const signer = restoreKeypair();

      // Initialize NDK singleton with optional signer
      const ndk = await initNDK(signer ?? undefined);

      // Register the instance with NDK React hooks layer
      initializeNDK(ndk);
    }

    bootstrap().catch((err) => {
      console.error("[NDKProvider] Failed to initialize NDK:", err);
    });
  }, [initializeNDK]);

  return null;
}

/**
 * NDKProvider wraps the app and initializes the Nostr layer.
 *
 * - Restores keypair from SecureStore on mount
 * - Initializes NDK singleton with SQLite cache + relay pool
 * - Registers NDK with the React hooks layer (useNDK, useSubscribe, etc.)
 * - Monitors session state with SecureStore persistence
 */
export function NDKProvider({ children }: NDKProviderProps) {
  return (
    <>
      <NDKHeadless />
      {children}
    </>
  );
}
