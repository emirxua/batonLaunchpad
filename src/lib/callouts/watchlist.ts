/**
 * Watchlist of high-signal callers on Pump.fun (e.g. Alon / Founders / Alpha callers)
 */

export interface WatchlistEntry {
  wallet: string;
  label: string;
  avatarUrl?: string;
  username?: string;
}

// Alon (pump.fun founder): 6DtEedWf9Wk5hA7Xth82Eq441yf5DA4aGLqaQAVfDokm
export const DEFAULT_WATCH_WALLETS = [
  "6DtEedWf9Wk5hA7Xth82Eq441yf5DA4aGLqaQAVfDokm",
];

export const DEFAULT_WATCH_LABELS: Record<string, string> = {
  "6DtEedWf9Wk5hA7Xth82Eq441yf5DA4aGLqaQAVfDokm": "Alon (Founder)",
};

/**
 * Returns the list of tracked caller wallet addresses from env or defaults.
 */
export function getWatchlistWallets(): string[] {
  if (typeof process !== "undefined" && process.env.CALLOUT_WATCH_WALLETS) {
    const fromEnv = process.env.CALLOUT_WATCH_WALLETS.split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    if (fromEnv.length > 0) {
      return fromEnv;
    }
  }
  return DEFAULT_WATCH_WALLETS;
}

/**
 * Returns a mapping of wallet addresses to human-readable labels.
 */
export function getWatchlistLabels(): Record<string, string> {
  const map: Record<string, string> = { ...DEFAULT_WATCH_LABELS };
  if (typeof process !== "undefined" && process.env.CALLOUT_WATCH_LABELS) {
    try {
      const parsed = JSON.parse(process.env.CALLOUT_WATCH_LABELS);
      if (typeof parsed === "object" && parsed !== null) {
        Object.assign(map, parsed);
      }
    } catch {
      // If comma-separated pairs "addr:label,addr2:label2"
      process.env.CALLOUT_WATCH_LABELS.split(",").forEach((pair) => {
        const [addr, label] = pair.split(":");
        if (addr && label) {
          map[addr.trim()] = label.trim();
        }
      });
    }
  }
  return map;
}

export function isWatchlistWallet(wallet: string): boolean {
  if (!wallet) return false;
  const list = getWatchlistWallets();
  return list.some((w) => w.toLowerCase() === wallet.toLowerCase());
}

/**
 * Attempt to resolve username/profile from pump.fun profile-api or fallback gracefully
 */
export async function resolveCallerProfile(
  wallet: string,
  jwt?: string
): Promise<{ username?: string; avatarUrl?: string }> {
  const labels = getWatchlistLabels();
  if (labels[wallet]) {
    return {
      username: labels[wallet],
    };
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; BatonOutbidBot/1.0)",
    };
    if (jwt) {
      headers["Authorization"] = jwt.startsWith("Bearer ") ? jwt : `Bearer ${jwt}`;
    }

    const res = await fetch(`https://profile-api.pump.fun/users/${wallet}`, {
      headers,
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        username: data?.username || undefined,
        avatarUrl: data?.image_uri || data?.avatar || undefined,
      };
    }
  } catch (err) {
    // Soft fallback - do not crash
    console.debug(`Profile resolve for ${wallet} skipped:`, err);
  }

  return {};
}
