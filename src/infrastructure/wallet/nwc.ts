import { NWCClient } from "@getalby/sdk";
import * as SecureStore from "expo-secure-store";

const NWC_URI_KEY = "nwc-connection-uri";

let nwcClient: NWCClient | null = null;

/**
 * Connect to a wallet via NWC URI.
 * Verifies the connection by calling getInfo(), then persists the URI
 * in expo-secure-store (encrypted on-device).
 */
export async function connectWallet(uri: string): Promise<NWCClient> {
  const client = new NWCClient({ nostrWalletConnectUrl: uri });

  // Verify connection is valid
  await client.getInfo();

  // Persist URI securely — NEVER log or store in plain text
  await SecureStore.setItemAsync(NWC_URI_KEY, uri);

  nwcClient = client;
  return client;
}

/**
 * Restore a previously connected wallet from secure storage.
 * Returns null if no URI is stored.
 */
export async function restoreWallet(): Promise<NWCClient | null> {
  const uri = await SecureStore.getItemAsync(NWC_URI_KEY);
  if (!uri) return null;

  try {
    const client = new NWCClient({ nostrWalletConnectUrl: uri });
    nwcClient = client;
    return client;
  } catch {
    // Stored URI is invalid — clean up
    await SecureStore.deleteItemAsync(NWC_URI_KEY);
    return null;
  }
}

/**
 * Disconnect wallet and remove stored URI.
 */
export async function disconnectWallet(): Promise<void> {
  if (nwcClient) {
    nwcClient.close();
    nwcClient = null;
  }
  await SecureStore.deleteItemAsync(NWC_URI_KEY);
}

/**
 * Get the current NWCClient instance, or null if not connected.
 */
export function getNWCClient(): NWCClient | null {
  return nwcClient;
}

/**
 * Convert millisatoshis to satoshis (floor division).
 */
export function msatsToSats(msats: number): number {
  return Math.floor(msats / 1000);
}

/**
 * Convert satoshis to millisatoshis.
 */
export function satsToMsats(sats: number): number {
  return sats * 1000;
}
