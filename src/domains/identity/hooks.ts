import { useAuthStore } from "./store";

/**
 * Returns a sign-out function that clears identity state.
 * In Fase 2, this will also disconnect NDK and clear Nostr keys.
 */
export function useSignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  return signOut;
}
