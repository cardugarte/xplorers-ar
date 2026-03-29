import { z } from "zod";

// ── LNURL-pay metadata (LUD-06/LUD-16) ──

const LNURLPayInfoSchema = z.object({
  callback: z.string().url(),
  minSendable: z.number().int().positive(),
  maxSendable: z.number().int().positive(),
  metadata: z.string(),
  tag: z.literal("payRequest"),
  commentAllowed: z.number().int().nonnegative().optional(),
  allowsNostr: z.boolean().optional(),
  nostrPubkey: z.string().optional(),
});

export type LNURLPayInfo = z.infer<typeof LNURLPayInfoSchema>;

const InvoiceResponseSchema = z.object({
  pr: z.string().min(1),
  routes: z.array(z.unknown()).optional(),
});

// ── Helpers ──

function parseLud16(lud16: string): { user: string; domain: string } {
  const parts = lud16.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid Lightning Address: ${lud16}`);
  }
  return { user: parts[0], domain: parts[1] };
}

/**
 * Fetch LNURL-pay info from a Lightning Address (LUD-16).
 *
 * Resolves `user@domain` → `https://domain/.well-known/lnurlp/user`
 * and returns the pay endpoint metadata.
 */
export async function fetchLNURLPayInfo(lud16: string): Promise<LNURLPayInfo> {
  const { user, domain } = parseLud16(lud16);

  const res = await fetch(`https://${domain}/.well-known/lnurlp/${user}`);
  if (!res.ok) {
    throw new Error(
      `LNURL fetch failed (${res.status}): ${await res.text().catch(() => "unknown")}`,
    );
  }

  const json: unknown = await res.json();
  return LNURLPayInfoSchema.parse(json);
}

/**
 * Request a Lightning invoice from a LNURL-pay callback.
 *
 * @param callback  The callback URL from LNURLPayInfo
 * @param sats      Amount in satoshis
 * @param zapRequest  Optional NIP-57 zap request event (JSON string)
 * @returns bolt11 invoice string
 */
export async function requestInvoice(
  callback: string,
  sats: number,
  zapRequest?: string,
): Promise<string> {
  const msats = sats * 1000;
  const url = new URL(callback);
  url.searchParams.set("amount", String(msats));

  if (zapRequest) {
    url.searchParams.set("nostr", zapRequest);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `Invoice request failed (${res.status}): ${await res.text().catch(() => "unknown")}`,
    );
  }

  const json: unknown = await res.json();
  const parsed = InvoiceResponseSchema.parse(json);
  return parsed.pr;
}

/**
 * Full flow: resolve Lightning Address → get invoice.
 *
 * Validates that the requested amount is within the pay endpoint's limits.
 */
export async function resolveAndRequestInvoice(
  lud16: string,
  sats: number,
  comment?: string,
): Promise<{ bolt11: string; payInfo: LNURLPayInfo }> {
  const payInfo = await fetchLNURLPayInfo(lud16);

  const msats = sats * 1000;
  if (msats < payInfo.minSendable || msats > payInfo.maxSendable) {
    throw new Error(
      `Monto fuera de rango: ${payInfo.minSendable / 1000}–${payInfo.maxSendable / 1000} sats`,
    );
  }

  // Build callback URL with amount
  const url = new URL(payInfo.callback);
  url.searchParams.set("amount", String(msats));

  if (comment && payInfo.commentAllowed && comment.length <= payInfo.commentAllowed) {
    url.searchParams.set("comment", comment);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `Invoice request failed (${res.status}): ${await res.text().catch(() => "unknown")}`,
    );
  }

  const json: unknown = await res.json();
  const parsed = InvoiceResponseSchema.parse(json);

  return { bolt11: parsed.pr, payInfo };
}
