---
name: nostr-nwc
description: >
  NWC (NIP-47) + Lightning Zaps (NIP-57) for payments.
  Trigger: When working with wallet connect, Lightning payments, zaps, reservations.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## NWC Overview (NIP-47)

Nostr Wallet Connect lets the app send payment commands to the user's Lightning wallet via encrypted Nostr events. The wallet can be Alby Hub, Zeus, Coinos, etc.

### Event Kinds

| Kind | Purpose |
|---|---|
| 13194 | Info (wallet advertises supported methods) |
| 23194 | Request (app → wallet, encrypted) |
| 23195 | Response (wallet → app, encrypted) |
| 23197 | Notification (wallet → app, e.g. payment_received) |

### Connection URI

```
nostr+walletconnect://<wallet-pubkey>?relay=<relay-url>&secret=<32-byte-hex>&lud16=<lightning-address>
```

- `secret` = client signing key (NEVER the user's nsec)
- Communication encrypted with NIP-44
- Wallet and app use separate Nostr keypairs per connection

## Implementation: @getalby/sdk NWCClient (Recommended for RN)

Bitcoin Connect is **web-only** — does NOT work in React Native. Use `@getalby/sdk` directly.

```typescript
import { nwc } from "@getalby/sdk";

// Connect
const client = new nwc.NWCClient({
  nostrWalletConnectUrl: "nostr+walletconnect://...",
});

// Pay invoice
const { preimage } = await client.payInvoice({ invoice: "lnbc..." });

// Create invoice (for receiving)
const invoice = await client.makeInvoice({
  amount: 1000,         // millisats
  description: "Reserva Camping El Bolsón",
});

// Get balance (returns millisatoshis)
const { balance } = await client.getBalance();

// List transactions
const { transactions } = await client.listTransactions({ limit: 10 });

// Cleanup
client.close();
```

### Required Polyfills for React Native

```typescript
// Import BEFORE anything else in app entry
import "react-native-get-random-values"; // crypto.getRandomValues
// Buffer polyfill also needed
```

Reference: [getAlby/nwc-react-native-expo](https://github.com/getAlby/nwc-react-native-expo)

## Alternative: NDK Wallet (Tighter Nostr Integration)

`@nostr-dev-kit/wallet` is bundled with `@nostr-dev-kit/mobile`:

```typescript
import { useNDKWallet } from "@nostr-dev-kit/mobile";

const { activeWallet, setActiveWallet, balances } = useNDKWallet();
setActiveWallet("nostr+walletconnect://...");
```

**Tradeoff**: Alby SDK is simpler and battle-tested for NWC. NDK wallet is more integrated but newer. Since NDK Mobile is already used for social (Fase 2), NDK wallet is the natural Fase 3 choice — but `@getalby/sdk` is the safer fallback.

## NIP-57: Zap Flow (Lightning Tips on Campings)

### Full Flow

1. **Get recipient's LNURL** from their profile `lud16` field
2. **Verify**: endpoint must have `allowsNostr: true` + `nostrPubkey`
3. **Create zap request (kind 9734)** — signed but NOT published to relays:

```json
{
  "kind": 9734,
  "content": "Gran camping!",
  "tags": [
    ["relays", "wss://relay.xplorers.app", "wss://nos.lol"],
    ["amount", "21000"],
    ["p", "<recipient-pubkey>"],
    ["a", "37515:<owner-pk>:<camping-d-tag>"]
  ]
}
```

4. **Send to LNURL callback**: `GET <callback>?amount=21000&nostr=<uri-encoded-9734>`
5. **Server returns BOLT11 invoice**
6. **Pay via NWC**: `client.payInvoice({ invoice: bolt11 })`
7. **Server publishes zap receipt (kind 9735)** to specified relays

### Zap Receipt (kind 9735) — Published by LNURL Server

```json
{
  "kind": 9735,
  "tags": [
    ["p", "<recipient-pk>"],
    ["P", "<sender-pk>"],
    ["bolt11", "lnbc..."],
    ["description", "<JSON of kind 9734>"],
    ["preimage", "<payment-preimage>"],
    ["a", "37515:<pk>:<d-tag>"]
  ]
}
```

### With NDK (Simplified)

```typescript
// NDK abstracts the entire zap flow
await ndk.zap(targetEvent, amountMillisats, "Gran camping!");
```

NDK handles LNURL lookup, zap request creation, invoice fetching, and payment (if wallet configured).

## NWC Methods Reference

| Method | Params | Response |
|---|---|---|
| `pay_invoice` | `invoice`, `amount?` | `preimage`, `fees_paid?` |
| `make_invoice` | `amount`, `description?`, `expiry?` | invoice details |
| `get_balance` | — | `balance` (millisats) |
| `list_transactions` | `from?`, `until?`, `limit?`, `type?` | transaction array |
| `get_info` | — | wallet metadata + capabilities |
| `lookup_invoice` | `payment_hash` or `invoice` | transaction details |

## Error Codes

`RATE_LIMITED`, `NOT_IMPLEMENTED`, `INSUFFICIENT_BALANCE`, `QUOTA_EXCEEDED`, `RESTRICTED`, `UNAUTHORIZED`, `INTERNAL`, `PAYMENT_FAILED`, `NOT_FOUND`, `OTHER`

## NWC Connection Flow (User Perspective)

1. User taps "Conectar Wallet" in Xplorers
2. Options: scan QR / paste URI / 1-click connect (NWA deeplink)
3. User goes to their wallet → creates "app connection" with budget
4. Wallet generates `nostr+walletconnect://` URI
5. User scans/pastes URI into Xplorers
6. App stores URI securely (expo-secure-store or MMKV)
7. Payments work within budget limits — no further wallet interaction

## Compatible Wallets

| Wallet | Type | NWC | Notes |
|---|---|---|---|
| **Alby Hub** | Self-custodial | Full | Best NWC support, self-hosted or cloud |
| **Zeus** | Self-custodial mobile | Full | Open source, embedded node |
| **Coinos** | Custodial web | Full | Free, easy onboarding |
| **Primal** | Custodial | Full | Integrated with Primal client |
| **Phoenix** | Self-custodial | **No** | Popular but no NIP-47 |

## Project State (Fase 3 Stubs)

Existing types in `src/domains/payments/types.ts`:
- `NWCConnection` — uri, pubkey, relay, secret, lud16
- `LightningInvoice` — bolt11, amount_sats, payment_hash
- `PaymentResult` — success, preimage, error

**Note**: NWC returns balances in **millisatoshis**. The `amount_sats` fields need conversion (`msats / 1000`).

## Breez SDK (Alternative — NOT Recommended for Xplorers)

Breez SDK runs an embedded Lightning node IN the app. Heavy (~8MB+ native libs), complex setup (LSP, channels). Better for dedicated wallet apps. Xplorers should use NWC — lighter, users bring their own wallet.

## Keywords
nwc, nip-47, lightning, zaps, nip-57, bitcoin, wallet, payments, invoice, lnurl
