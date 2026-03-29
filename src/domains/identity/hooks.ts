import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/src/infrastructure/supabase/client";

import { useAuthStore } from "./store";

/**
 * Initializes auth state: listens to onAuthStateChange and
 * auto signs-in anonymously if no session exists.
 * Call once at the root layout.
 */
export function useEnsureSession() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Subscribe to auth state changes first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Then ensure a session exists
    async function ensureSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
        // onAuthStateChange will pick up the new session
      } else {
        setSession(session);
        setLoading(false);
      }
    }

    ensureSession();

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);
}

/**
 * Sign in with email and password.
 */
export function useSignIn() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Sign up with email and password (creates a new account).
 */
export function useSignUp() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Upgrade an anonymous session to a full email account.
 * Preserves the user_id so all existing data is retained.
 */
export function useUpgradeAnonymous() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Sign out the current user.
 */
export function useSignOut() {
  const { setSession, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLoading(false);
        throw error;
      }
      setSession(null);
      setLoading(false);
    },
  });
}
