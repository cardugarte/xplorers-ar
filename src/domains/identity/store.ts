import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import type { AuthMethod, AuthState, NostrIdentity } from "./types";

interface AuthActions {
  setIdentity: (identity: NostrIdentity, method: AuthMethod) => void;
  signOut: () => void;
  setAnonymous: () => void;
  /** Set the Supabase session and derive isAnonymous from it. */
  setSession: (session: Session | null) => void;
  /** Toggle the loading flag (used during auth state transitions). */
  setLoading: (loading: boolean) => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  identity: null,
  authMethod: null,
};

export const useAuthStore = create<
  AuthState & AuthActions & { isAnonymous: boolean; session: Session | null; isLoading: boolean }
>((set) => ({
  ...initialState,
  isAnonymous: true,
  session: null,
  isLoading: true,

  setIdentity: (identity, authMethod) =>
    set({ identity, authMethod, isAuthenticated: true, isAnonymous: false }),

  setAnonymous: () =>
    set({ ...initialState, isAnonymous: true }),

  signOut: () =>
    set({ ...initialState, isAnonymous: true, session: null }),

  setSession: (session) =>
    set({
      session,
      isAnonymous: session?.user?.is_anonymous ?? true,
      isAuthenticated: session !== null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
