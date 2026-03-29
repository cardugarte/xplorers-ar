/**
 * Strfry write policy plugin (Deno runtime)
 *
 * Strfry calls this script for each incoming event via stdin.
 * Response must be JSON: { id, action: "accept" | "reject", msg }
 *
 * Allowed kinds are scoped to Xplorers use cases:
 *   0     — Metadata (user profiles)
 *   1     — Short text notes
 *   7     — Reactions
 *   1111  — Comments (NIP-22)
 *   1985  — Label (NIP-32, for camping tags/reviews)
 *   9735  — Zap receipt (Lightning payments)
 *   10037 — Relay list (NIP-65 relay hints)
 *   30008 — Profile badges
 *   30009 — Badge definitions
 *   30315 — User status
 *   30402 — Classifieds / listings (camping offers)
 *   37515 — Camping venues (custom Xplorers kind)
 */

const ALLOWED_KINDS = new Set([
  0,     // Metadata
  1,     // Short text notes
  7,     // Reactions
  1111,  // Comments (NIP-22)
  1985,  // Label (NIP-32)
  9735,  // Zap receipt
  10037, // Relay list
  30008, // Profile badges
  30009, // Badge definitions
  30315, // User status
  30402, // Classifieds / listings
  37515, // Camping venues (Xplorers)
]);

const input = await Deno.readTextFile("/dev/stdin");
const { event } = JSON.parse(input);

const action = ALLOWED_KINDS.has(event.kind) ? "accept" : "reject";
const msg = action === "reject" ? `Kind ${event.kind} not allowed on Xplorers relay` : "";

console.log(JSON.stringify({ id: event.id, action, msg }));
