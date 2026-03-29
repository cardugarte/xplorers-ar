import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NWCClient } from "@getalby/sdk";

import {
  connectWallet,
  restoreWallet,
  disconnectWallet,
  getNWCClient,
  msatsToSats,
} from "@/src/infrastructure/wallet/nwc";

/**
 * Hook to manage NWC wallet connection lifecycle.
 * Restores persisted connection on mount, provides connect/disconnect.
 */
export function useWalletConnection() {
  const [client, setClient] = useState<NWCClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const queryClient = useQueryClient();

  // Restore persisted wallet on mount
  useEffect(() => {
    let cancelled = false;

    restoreWallet()
      .then((restored) => {
        if (!cancelled && restored) {
          setClient(restored);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoring(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(
    async (uri: string) => {
      setIsConnecting(true);
      try {
        const c = await connectWallet(uri);
        setClient(c);
        // Invalidate balance query so it fetches immediately
        await queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      } finally {
        setIsConnecting(false);
      }
    },
    [queryClient],
  );

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setClient(null);
    // Clear wallet-related cache
    queryClient.removeQueries({ queryKey: ["wallet"] });
  }, [queryClient]);

  return {
    client,
    isConnected: client !== null,
    isConnecting,
    isRestoring,
    connect,
    disconnect,
  };
}

/**
 * Query hook for wallet balance. Refetches every 30s while connected.
 * Returns balance in satoshis.
 */
export function useWalletBalance() {
  const client = getNWCClient();

  return useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      if (!client) throw new Error("Wallet not connected");
      const { balance } = await client.getBalance();
      return msatsToSats(balance);
    },
    enabled: !!client,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
