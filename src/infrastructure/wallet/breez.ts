/**
 * Breez SDK Liquid — typed wrapper (interface-first implementation)
 *
 * The actual @breeztech/react-native-breez-sdk-liquid native module is NOT installed.
 * This module exports proper TypeScript interfaces so other code can depend on it today.
 * All SDK-backed functions throw descriptive errors explaining what's needed to wire
 * the real SDK when the Breez API key is obtained and the native module is configured.
 *
 * To wire the real SDK:
 *   1. Request API key: contact@breez.technology
 *   2. Install: npm install @breeztech/react-native-breez-sdk-liquid
 *   3. Add EXPO_PUBLIC_BREEZ_API_KEY to .env
 *   4. Run EAS dev client build (Expo Go does NOT support native modules)
 *   5. Replace placeholder implementations with real SDK calls
 */

import * as SecureStore from "expo-secure-store";

// ─── Constants ───────────────────────────────────────────────────────────────

const MNEMONIC_KEY = "breez-mnemonic";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface BreezConfig {
  /** Breez API key — request at contact@breez.technology */
  apiKey: string;
  /** "mainnet" | "testnet". Defaults to "mainnet". */
  network?: "mainnet" | "testnet";
  /**
   * Optional working directory for the SDK's internal state.
   * Defaults to the app's documents directory if not provided.
   */
  workingDir?: string;
}

export interface BreezBalance {
  /** Confirmed balance in satoshis */
  balanceSat: number;
  /** Outgoing payments in-flight (satoshis) */
  pendingSendSat: number;
  /** Incoming payments in-flight (satoshis) */
  pendingReceiveSat: number;
}

export interface BreezReceiveRequest {
  /** Amount to receive in satoshis */
  amountSat: number;
  /** Payment description shown to the sender */
  description: string;
}

export interface BreezReceiveResult {
  /** BOLT11 invoice string to share with the payer */
  invoice: string;
  /** Estimated swap fee in satoshis (L-BTC ↔ Lightning) */
  feesSat: number;
}

export interface BreezPaymentResult {
  /** Whether the payment completed successfully */
  success: boolean;
  /** Payment preimage (proof of payment) — null if payment failed */
  preimage: string | null;
  /** Human-readable error message — null if payment succeeded */
  error: string | null;
}

// ─── Mnemonic Storage (SecureStore — works for real) ─────────────────────────

/**
 * Persist the owner's BIP-39 mnemonic to secure storage.
 * CRITICAL: Show a backup warning before calling this. If the owner loses the
 * mnemonic, they lose access to the funds permanently.
 */
export async function storeMnemonic(mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(MNEMONIC_KEY, mnemonic);
}

/**
 * Retrieve the owner's BIP-39 mnemonic from secure storage.
 * Returns null if no mnemonic has been stored yet.
 */
export async function getMnemonic(): Promise<string | null> {
  return SecureStore.getItemAsync(MNEMONIC_KEY);
}

// ─── SDK Placeholder Functions ────────────────────────────────────────────────
// These throw descriptive errors. Replace with real SDK calls once:
//   - @breeztech/react-native-breez-sdk-liquid is installed
//   - EXPO_PUBLIC_BREEZ_API_KEY is set
//   - App is built with EAS dev client

/**
 * Initialize the Breez SDK Liquid singleton with the given mnemonic.
 *
 * Real implementation:
 *   const config = await defaultConfig(LiquidNetwork.MAINNET, BREEZ_API_KEY);
 *   await connect({ config, mnemonic });
 */
export async function initBreez(_config: BreezConfig, _mnemonic: string): Promise<void> {
  throw new Error(
    "[Breez SDK] Not wired: install @breeztech/react-native-breez-sdk-liquid, " +
      "set EXPO_PUBLIC_BREEZ_API_KEY in .env, and rebuild with EAS dev client. " +
      "See issue #36 for setup instructions."
  );
}

/**
 * Fetch the current wallet balance from the Breez SDK.
 *
 * Real implementation:
 *   const info = await getInfo();
 *   return { balanceSat: info.balanceSat, pendingSendSat: info.pendingSendSat, pendingReceiveSat: info.pendingReceiveSat };
 */
export async function getBreezBalance(): Promise<BreezBalance> {
  throw new Error(
    "[Breez SDK] Not wired: call initBreez() first. " +
      "Requires @breeztech/react-native-breez-sdk-liquid and EXPO_PUBLIC_BREEZ_API_KEY."
  );
}

/**
 * Pay a BOLT11 Lightning invoice.
 *
 * Real implementation:
 *   const prepare = await prepareSendPayment({ invoice });
 *   const payment = await sendPayment({ prepareResponse: prepare });
 *   return { success: true, preimage: payment.payment.preimage ?? null, error: null };
 */
export async function payBreezInvoice(_bolt11: string): Promise<BreezPaymentResult> {
  throw new Error(
    "[Breez SDK] Not wired: call initBreez() first. " +
      "Requires @breeztech/react-native-breez-sdk-liquid and EXPO_PUBLIC_BREEZ_API_KEY."
  );
}

/**
 * Create a BOLT11 Lightning invoice to receive a payment.
 *
 * Real implementation:
 *   const prepare = await prepareReceivePayment({
 *     paymentMethod: PaymentMethod.LIGHTNING,
 *     amount: { type: 'bitcoin', amountSat: req.amountSat },
 *   });
 *   const receive = await receivePayment({ prepareResponse: prepare, description: req.description });
 *   return { invoice: receive.destination, feesSat: prepare.feesSat };
 *
 * Note: Liquid Network swap fees apply (~0.1–0.5%). Always show feesSat to the owner
 * before confirming.
 */
export async function receiveBreezPayment(
  _req: BreezReceiveRequest
): Promise<BreezReceiveResult> {
  throw new Error(
    "[Breez SDK] Not wired: call initBreez() first. " +
      "Requires @breeztech/react-native-breez-sdk-liquid and EXPO_PUBLIC_BREEZ_API_KEY."
  );
}
