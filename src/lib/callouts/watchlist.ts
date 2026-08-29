// ─── Watchlist: known callers ─────────────────────────────────────────────────
// Source: CALLOUT_WATCH_WALLETS / CALLOUT_WATCH_LABELS env vars
// Defaults are the community-curated list (as of Aug 2026)

export const DEFAULT_WATCHLIST: Record<string, string> = {
  "2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f": "cupseyyyyy",
  "5YRgrP3mjGzrzirYYN5HAQH19cTYREYwGxW6XRJQUzij": "slingoor",
  "FNcrF6nt9BXswJrHom4hNmXCeW9no2C8wKh5UqdP8ueu": "archelon",
  "7fEXteaTtmX1uR8fpChEXsevM4icH5vq8LNL9dzDupX2": "croakie",
  "BSzpGGB3AMwtW126RT3Z27STSBrVjKV5A96H4BsUKdtD": "ferre",
  "5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM": "schoen",
  "HmUt3Jn46j7c7ANdURmEyjSRj8i3Em6MhjQUi37PZ219": "netvyxe",
  "GV6UUmNxz2RpKxmNAPadYKb7uQpszwqQAu3qLJxVdC52": "ansemconzimp",
  "6i2aHtxfqkC2biTo98FSkP59FVHPKFRLZWDbdghN6WKK": "sapijiju",
  "6DtEedWf9Wk5hA7Xth82Eq441yf5DA4aGLqaQAVfDokm": "alonalon",
};

/**
 * Returns wallet → label map, merging env overrides over defaults.
 * CALLOUT_WATCH_WALLETS: comma-separated wallet addresses
 * CALLOUT_WATCH_LABELS:  JSON  {"wallet": "label", ...}
 *                     OR comma-separated  "wallet:label,wallet2:label2"
 */
export function getWatchlistMap(): Record<string, string> {
  const map: Record<string, string> = { ...DEFAULT_WATCHLIST };

  if (process.env.CALLOUT_WATCH_LABELS) {
    try {
      const parsed = JSON.parse(process.env.CALLOUT_WATCH_LABELS);
      if (typeof parsed === "object" && parsed !== null) {
        Object.assign(map, parsed);
      }
    } catch {
      // Try "wallet:label,..." format
      process.env.CALLOUT_WATCH_LABELS.split(",").forEach((pair) => {
        const idx = pair.indexOf(":");
        if (idx > 0) {
          const addr = pair.slice(0, idx).trim();
          const label = pair.slice(idx + 1).trim();
          if (addr && label) map[addr] = label;
        }
      });
    }
  }

  return map;
}

/**
 * Returns the ordered list of wallets to fetch.
 * If CALLOUT_WATCH_WALLETS is set, those wallets are used (plus defaults).
 * Otherwise returns all default watchlist wallets.
 */
export function getWatchlistWallets(): string[] {
  const map = getWatchlistMap();

  if (process.env.CALLOUT_WATCH_WALLETS) {
    const extra = process.env.CALLOUT_WATCH_WALLETS.split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    // extra takes precedence; default list still included unless overridden
    const combined = Array.from(new Set([...extra, ...Object.keys(map)]));
    return combined;
  }

  return Object.keys(map);
}
