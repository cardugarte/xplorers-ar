---
name: nostr-ndk
description: >
  Nostr protocol + NDK Mobile patterns for React Native.
  Trigger: When working with Nostr events, identity, social features, NDK.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## Nostr Event Structure (Foundation)

Every piece of data in Nostr is an **event** — signed JSON:

```json
{
  "id": "<sha256 hex>",
  "pubkey": "<32-byte hex public key>",
  "created_at": "<unix timestamp seconds>",
  "kind": "<integer 0-65535>",
  "tags": [["<key>", "<value>", ...], ...],
  "content": "<string>",
  "sig": "<Schnorr signature>"
}
```

## Event Kind Ranges (REQUIRED Knowledge)

| Range | Type | Relay Behavior |
|---|---|---|
| 0, 3 | Replaceable | Latest per pubkey+kind kept |
| 1-2, 4-44, 1000-9999 | Regular | All stored |
| 10000-19999 | Replaceable | Latest per pubkey+kind kept |
| 20000-29999 | Ephemeral | NOT stored |
| **30000-39999** | **Addressable** | Latest per **kind+pubkey+d-tag** kept |

**CAMPING_VENUE (37515)** is addressable — identified by `37515:<pubkey>:<d-tag>`. Publishing a new event with same kind+pubkey+d-tag replaces the old one.

## Xplorers Event Kinds

```typescript
// All kinds used by the project
METADATA: 0,           // NIP-01: user profile (name, about, picture, lud16)
SHORT_TEXT_NOTE: 1,    // NIP-01: social feed posts
REACTION: 7,           // NIP-25: likes/emoji on campings or reviews
BADGE_AWARD: 8,        // NIP-58: award badges to users (immutable)
COMMENT: 1111,         // NIP-22: reviews/comments on campings
ZAP_REQUEST: 9734,     // NIP-57: zap request (sent to LNURL, never published)
ZAP_RECEIPT: 9735,     // NIP-57: zap receipt (proof of Lightning payment)
PROFILE_BADGES: 30008, // NIP-58: user-curated badge display
BADGE_DEFINITION: 30009, // NIP-58: badge metadata (by Xplorers pubkey)
STATUS: 30315,         // NIP-38: "Acampando en El Bolsón"
CAMPING_VENUE: 37515,  // Custom: camping venue with geohash + amenities
```

## Tags — Single-Letter Tags Are Indexed

```typescript
// Standard tags (indexed by relays, queryable via #<letter>)
["e", "<event-id>", "<relay-hint>"]          // reference event
["p", "<pubkey>", "<relay-hint>"]            // reference user
["a", "37515:<pubkey>:<d-tag>", "<relay>"]   // reference addressable event
["d", "camping-el-bolson"]                   // addressable event identifier
["g", "6ej1u"]                               // geohash (NIP-52 convention)
["t", "patagonia"]                           // hashtag
["k", "37515"]                               // kind reference (string!)

// Uppercase = root scope (NIP-22 comments)
["E", "<root-event-id>"]    // root event being commented on
["A", "37515:pk:slug"]      // root addressable event
["K", "37515"]              // root event kind
["P", "<root-author>"]      // root event author
```

## CAMPING_VENUE Event (kind:37515)

```json
{
  "kind": 37515,
  "content": "{\"description\":\"...\",\"amenities\":{...},\"price_range\":{...}}",
  "tags": [
    ["d", "camping-el-bolson"],
    ["name", "Camping El Bolsón"],
    ["g", "6ej1u"], ["g", "6ej1"], ["g", "6ej"], ["g", "6e"],
    ["location", "El Bolsón, Río Negro, Argentina"],
    ["L", "countryCode"], ["l", "AR", "countryCode"],
    ["t", "camping"], ["t", "patagonia"],
    ["image", "https://...", "1200x800"],
    ["alt", "Camping El Bolsón - Patagonia Argentina"]
  ]
}
```

**Multiple `g` tags at decreasing precision** for area queries. Geohash precision 5 (~4.9km) matches the scraper pipeline.

**Querying by area:**
```json
{ "kinds": [37515], "#g": ["6ej"] }
```

## NIP-19: bech32 Identifiers (REQUIRED)

```
npub / nsec  → display/transport ONLY, never in events
nprofile     → pubkey + relay hints (shareable profile link)
nevent       → event-id + relays + author (shareable event link)
naddr        → d-tag + author + kind + relays (shareable camping link)
```

**Events always use raw hex pubkeys, NEVER bech32.**

## NDK Mobile Setup (REQUIRED Pattern)

Package: **`@nostr-dev-kit/mobile`** (re-exports core + react + mobile-specific)

```typescript
// ✅ Import everything from mobile — NEVER from @nostr-dev-kit/ndk directly
import NDK, { NDKEvent, useSubscribe, useNDK } from "@nostr-dev-kit/mobile";

// ❌ NEVER
import NDK from "@nostr-dev-kit/ndk";
import { useSubscribe } from "@nostr-dev-kit/ndk-react"; // doesn't exist
```

### Singleton (NO React Context)

```typescript
// lib/ndk.ts
import NDK, { NDKCacheAdapterSqlite } from "@nostr-dev-kit/mobile";

const cacheAdapter = new NDKCacheAdapterSqlite("xplorers");
cacheAdapter.initialize(); // synchronous

const ndk = new NDK({
  cacheAdapter,
  explicitRelayUrls: [
    "wss://relay.xplorers.app",
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band",
  ],
  clientName: "xplorers",
});

export default ndk;
```

### NDKHeadless Component (renders nothing, initializes NDK)

```tsx
import { useNDKInit, useNDKSessionMonitor, NDKSessionExpoSecureStore } from "@nostr-dev-kit/mobile";
import ndk from "@/lib/ndk";

export default function NDKHeadless() {
  const initNDK = useNDKInit();
  const sessionStorage = useRef(new NDKSessionExpoSecureStore());

  useNDKSessionMonitor(sessionStorage.current, { profile: true, follows: true });

  useEffect(() => {
    ndk.connect();
    initNDK(ndk);
  }, [initNDK]);

  return null; // renders nothing
}
```

## NDK Critical Rules (REQUIRED)

```typescript
// ✅ Do NOT await publish — optimistic, retries via cache
const event = new NDKEvent(ndk);
event.kind = 1;
event.content = "Hello Nostr";
event.publish(); // fire and forget

// ❌ NEVER
await event.publish();
await event.sign(); event.publish(); // sign is automatic

// ✅ NDKPrivateKeySigner.generate() is SYNCHRONOUS
const signer = NDKPrivateKeySigner.generate();

// ❌ WRONG
const signer = await NDKPrivateKeySigner.generate();

// ✅ useSubscribe returns { events, eose } — NO loading state
const { events, eose } = useSubscribe([{ kinds: [37515], "#g": ["6ej"] }]);

// ❌ These DON'T exist
const { events, loading } = useSubscribe(...);  // no loading prop
const { events } = useEvents(...);              // useEvents doesn't exist
```

## Hooks (from @nostr-dev-kit/react, re-exported by mobile)

```typescript
// NDK access
const { ndk } = useNDK();

// Subscriptions — primary data hook
const { events, eose } = useSubscribe<NDKEvent>(filters, opts?, deps?);
// Pass false as filters to disable: useSubscribe(shouldFetch ? filters : false)

// Cache-only observer (no relay subscription)
const events = useObserver<NDKEvent>(filters, opts?, deps?);

// Single event
const event = useEvent(idOrFilter); // undefined=loading, null=not found

// Profile
const profile = useProfileValue(pubkeyOrUser); // NOT { profile }

// Session
const login = useNDKSessionLogin();
await login(signer);   // NDKPrivateKeySigner or NDKNip46Signer
const logout = useNDKSessionLogout();
const currentUser = useNDKCurrentUser();
```

## Signers

```typescript
// Local key (onboarding — generate new identity)
const signer = NDKPrivateKeySigner.generate(); // sync!
await login(signer);
// Store nsec in expo-secure-store for recovery

// NIP-46 (existing Nostr users — nsec.app, Amber via relay)
const signer = new NDKNip46Signer(ndk, "bunker://...");
await login(signer);

// NIP-55 (Android signer apps — Amber direct)
import { NDKNip55Signer, useNip55 } from "@nostr-dev-kit/mobile";
const { isAvailable, apps } = useNip55();
const signer = new NDKNip55Signer(packageName);
```

## NIP-22: Comments on Campings

```json
{
  "kind": 1111,
  "content": "Hermoso lugar, lo recomiendo",
  "tags": [
    ["A", "37515:<owner-pk>:<d-tag>", "wss://relay.xplorers.app"],
    ["K", "37515"],
    ["P", "<owner-pk>"],
    ["a", "37515:<owner-pk>:<d-tag>", "wss://relay.xplorers.app"],
    ["k", "37515"],
    ["p", "<owner-pk>"]
  ]
}
```

Query comments for a camping: `{ "kinds": [1111], "#A": ["37515:<pk>:<d-tag>"] }`

## NIP-25: Reactions

```json
{
  "kind": 7,
  "content": "+",
  "tags": [
    ["a", "37515:<owner-pk>:<d-tag>"],
    ["p", "<owner-pk>"],
    ["k", "37515"]
  ]
}
```

Content: `"+"` = like, `"-"` = dislike, emoji = reaction.

## NIP-58: Badges

```typescript
// Badge Definition (kind 30009) — Xplorers app pubkey issues
{ kind: 30009, tags: [["d", "explorador-i"], ["name", "Explorador I"], ["description", "..."]] }

// Badge Award (kind 8) — immutable, can't revoke
{ kind: 8, tags: [["a", "30009:<xplorers-pk>:explorador-i"], ["p", "<user-pk>"]] }

// Profile Badges (kind 30008) — user curates display (a+e pairs)
{ kind: 30008, tags: [["d", "profile_badges"], ["a", "30009:..."], ["e", "<award-id>"]] }
```

## NIP-38: User Status

```json
{
  "kind": 30315,
  "content": "Acampando en El Bolsón",
  "tags": [
    ["d", "general"],
    ["a", "37515:<pk>:<d-tag>"]
  ]
}
```

Empty content = clear status. Addressable: one status per d-tag per user.

## Local-First Principle (REQUIRED)

Never show loading spinners for Nostr data. Render what's available from cache, update reactively when relay data arrives. Events from `useSubscribe` come pre-sorted by `created_at`.

## Keywords
nostr, ndk, ndk-mobile, protocol, nips, events, kinds, pubkey, relay, identity, social
