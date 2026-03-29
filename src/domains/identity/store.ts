import { create } from "zustand";

import type { AuthMethod, AuthState, NostrIdentity } from "./types";

interface AuthActions {
  setIdentity: (identity: NostrIdentity, method: AuthMethod) => void;
  signOut: () => void;
  setAnonymous: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  identity: null,
  authMethod: null,
};

export const useAuthStore = create<AuthState & AuthActions & { isAnonymous: boolean }>((set) => ({
  ...initialState,
  isAnonymous: true,

  setIdentity: (identity, authMethod) =>
    set({ identity, authMethod, isAuthenticated: true, isAnonymous: false }),

  setAnonymous: () =>
    set({ ...initialState, isAnonymous: true }),

  signOut: () =>
    set({ ...initialState, isAnonymous: true }),
}));
