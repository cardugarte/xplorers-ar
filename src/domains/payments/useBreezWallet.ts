/**
 * useBreezWallet — React hook for Breez SDK Liquid wallet state.
 *
 * Wraps the infrastructure-level Breez functions and provides React-friendly
 * balance, loading, and error states. Safe to call even before the SDK is wired:
 * all errors are caught and surfaced via the `error` state rather than throwing.
 *
 * When the real SDK is integrated (see src/infrastructure/wallet/breez.ts),
 * this hook requires initBreez() to be called once during owner onboarding
 * before any balance or payment operations are attempted.
 */

import { useCallback, useState } from "react";

import {
  getBreezBalance,
  payBreezInvoice,
  type BreezBalance,
  type BreezPaymentResult,
} from "@/src/infrastructure/wallet/breez";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseBreezWalletReturn {
  /** Current wallet balance, or null if not yet loaded */
  balance: BreezBalance | null;
  /** True while a balance fetch or payment is in progress */
  isLoading: boolean;
  /** Last error message, or null if no error has occurred */
  error: string | null;
  /**
   * Fetch the current balance from the Breez SDK.
   * Will set `error` if the SDK is not yet wired or any other failure occurs.
   */
  refreshBalance: () => Promise<void>;
  /**
   * Pay a BOLT11 Lightning invoice.
   * Returns the payment result, or null if an unexpected error occurred.
   * Always check `error` after calling this function.
   */
  pay: (bolt11: string) => Promise<BreezPaymentResult | null>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBreezWallet(): UseBreezWalletReturn {
  const [balance, setBalance] = useState<BreezBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBreezBalance();
      setBalance(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error fetching balance";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pay = useCallback(
    async (bolt11: string): Promise<BreezPaymentResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payBreezInvoice(bolt11);
        if (!result.success && result.error) {
          setError(result.error);
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error processing payment";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { balance, isLoading, error, refreshBalance, pay };
}
