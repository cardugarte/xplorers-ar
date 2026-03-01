export interface NostrIdentity {
  npub: string;
  nsec?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  lud16?: string;
  nip05?: string;
}

export type AuthMethod = "generated" | "nip46" | "nip55";

export interface AuthState {
  isAuthenticated: boolean;
  identity: NostrIdentity | null;
  authMethod: AuthMethod | null;
}
