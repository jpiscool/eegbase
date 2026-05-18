// ── In-memory rate limiter ──────────────────────────────────────────────────
// Token-bucket per (bucket, key). Lives in a module-scoped Map, so the
// limiter is per-Node-instance, not per-cluster. On Vercel that means
// each cold container has its own bucket — not perfect, but defeats
// casual abuse (brute-force, fill-the-db spam) without adding a Redis
// dependency. Swap to Upstash @vercel/kv when traffic warrants it.
//
// Usage:
//   const r = checkRate("forgot-password", clientIp, { max: 5, windowMs: 60_000 });
//   if (!r.ok) return { error: r.retryAfterMs ? `Try again in ${...}s` : "Too many requests" };

interface Bucket {
  tokens: number;
  // ms timestamp when the bucket was last refilled.
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Soft-garbage collect to keep the Map bounded. Triggered opportunistically
// on each call when the Map crosses MAX_KEYS, removing entries older than
// the longest reasonable window.
const MAX_KEYS = 10_000;
const GC_OLDER_THAN_MS = 60 * 60 * 1000; // 1 h

function gc(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [k, b] of buckets) {
    if (now - b.lastRefill > GC_OLDER_THAN_MS) buckets.delete(k);
  }
}

export interface RateOptions {
  max: number;       // Max requests in `windowMs`.
  windowMs: number;  // Sliding refill window in ms.
}

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * @param bucket  — logical name, e.g. "forgot-password"
 * @param key     — discriminator within the bucket, typically the client IP
 *                  (or the email being attacked, for credential-stuffing
 *                  rate limits keyed to the target rather than the source).
 */
export function checkRate(bucket: string, key: string, opts: RateOptions): RateResult {
  const now = Date.now();
  gc(now);
  const id = `${bucket}|${key}`;
  let b = buckets.get(id);
  if (!b) {
    b = { tokens: opts.max, lastRefill: now };
    buckets.set(id, b);
  }
  // Refill proportional to time since last refill.
  const elapsed = now - b.lastRefill;
  const refill = (elapsed / opts.windowMs) * opts.max;
  if (refill > 0) {
    b.tokens = Math.min(opts.max, b.tokens + refill);
    b.lastRefill = now;
  }
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { ok: true, remaining: Math.floor(b.tokens), retryAfterMs: 0 };
  }
  // No tokens left — caller must wait until at least 1 token regenerates.
  const msPerToken = opts.windowMs / opts.max;
  const retryAfterMs = Math.ceil(msPerToken * (1 - b.tokens));
  return { ok: false, remaining: 0, retryAfterMs };
}

/**
 * Best-effort extraction of the client IP from a request. Vercel sets
 * x-forwarded-for; behind a CDN we may see comma-separated chains, in
 * which case the leftmost address is the real client.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
