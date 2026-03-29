import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

interface AuthStore {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  isAnonymous: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ isLoading: loading }),
  isAnonymous: () => {
    const { session } = get();
    if (!session) return true;
    // Supabase marks anonymous users with is_anonymous in the JWT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (session.user.user_metadata as any)?.is_anonymous === true ||
      session.user.is_anonymous === true;
  },
}));
