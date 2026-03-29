/**
 * Type stubs for @getalby/sdk.
 *
 * Minimal declarations to allow `tsc --noEmit` to pass on the main
 * branch where the package is not yet installed.
 *
 * These stubs will be replaced by the real package types once
 * @getalby/sdk is installed (tracked in Fase 3 — Lightning payments).
 */

declare module "@getalby/sdk" {
  export class NWCClient {
    constructor(opts: { nostrWalletConnectUrl: string });
    getInfo(): Promise<{ alias: string; methods: string[] }>;
    getBalance(): Promise<{ balance: number }>;
    payInvoice(opts: { invoice: string }): Promise<{ preimage: string }>;
    makeInvoice(opts: {
      amount: number;
      description?: string;
    }): Promise<{ invoice: string; payment_hash: string }>;
    close(): void;
  }
}
