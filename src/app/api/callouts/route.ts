import { NextResponse } from "next/server";
import { CalloutCard, WatchedSummary } from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 30;

// Persistent Global Cache in Node.js runtime
let GLOBAL_CALLOUT_CACHE: CalloutCard[] = [];
let LAST_SUCCESSFUL_TS = 0;

interface WorkerWalletResult {
  wallet: string;
  ok?: boolean;
  status?: number;
  callouts?: Record<string, unknown>[];
  error?: string;
}

interface WorkerPackageResponse {
  updatedAt?: string | number;
  results?: WorkerWalletResult[];
  callouts?: Record<string, unknown>[];
}

export async function GET() {
  const now = Date.now();
  const labelMap = getWatchlistMap();

  const endpoints = [
    process.env.CALLOUT_PROXY_BASE ||
      process.env.NEXT_PUBLIC_CALLOUT_PROXY_URL ||
      "https://callout-worker.batonoutbid.workers.dev/callouts",
    "https://pump-callout-proxy.emir1903topuz106.workers.dev/",
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as WorkerPackageResponse | Record<string, unknown>[];
        const allCallouts: CalloutCard[] = [];

        if (Array.isArray(data)) {
          // Direct array response
          for (const item of data) {
            if (item && typeof item === "object" && item.coinMint) {
              const wallet = String(item.callerWallet || item.wallet || "");
              const label =
                String(item.callerLabel || "") ||
                labelMap[wallet] ||
                DEFAULT_WATCHLIST[wallet] ||
                (wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "Verified Caller");

              allCallouts.push({
                calloutId: String(item.calloutId || item.id || `${item.coinMint}-${item.createdAt}`),
                callerWallet: wallet,
                callerLabel: label,
                coinMint: String(item.coinMint),
                mediaUrl: item.mediaUrl ? String(item.mediaUrl) : null,
                thesis: item.thesis ? String(item.thesis) : null,
                marketCap: Number(item.marketCap || item.entryMcap || 0),
                maxMultiplier: Number(item.maxMultiplier || item.athMultiplier || 1),
                createdAt: Number(item.createdAt || now),
              });
            }
          }
        } else if (data && typeof data === "object") {
          // Package with results array
          if (Array.isArray(data.results)) {
            for (const item of data.results) {
              const wallet = item.wallet;
              const label =
                labelMap[wallet] ??
                DEFAULT_WATCHLIST[wallet] ??
                `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

              const calloutsList = Array.isArray(item.callouts) ? item.callouts : [];
              for (const c of calloutsList) {
                allCallouts.push({
                  calloutId: String(c.calloutId || `${c.coinMint}-${c.createdAt}`),
                  callerWallet: wallet,
                  callerLabel: label,
                  coinMint: String(c.coinMint),
                  mediaUrl: c.mediaUrl ? String(c.mediaUrl) : null,
                  thesis: c.thesis ? String(c.thesis) : null,
                  marketCap: Number(c.marketCap || 0),
                  maxMultiplier: Number(c.maxMultiplier || 1),
                  createdAt: Number(c.createdAt || now),
                });
              }
            }
          } else if (Array.isArray(data.callouts)) {
            for (const c of data.callouts) {
              const wallet = String(c.callerWallet || c.wallet || "");
              const label =
                String(c.callerLabel || "") ||
                labelMap[wallet] ||
                DEFAULT_WATCHLIST[wallet] ||
                `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

              allCallouts.push({
                calloutId: String(c.calloutId || `${c.coinMint}-${c.createdAt}`),
                callerWallet: wallet,
                callerLabel: label,
                coinMint: String(c.coinMint),
                mediaUrl: c.mediaUrl ? String(c.mediaUrl) : null,
                thesis: c.thesis ? String(c.thesis) : null,
                marketCap: Number(c.marketCap || 0),
                maxMultiplier: Number(c.maxMultiplier || 1),
                createdAt: Number(c.createdAt || now),
              });
            }
          }
        }

        if (allCallouts.length > 0) {
          allCallouts.sort((a, b) => b.createdAt - a.createdAt);
          GLOBAL_CALLOUT_CACHE = allCallouts;
          LAST_SUCCESSFUL_TS = now;
          break; // Successfully loaded and cached
        }
      }
    } catch {
      // Try next endpoint or fallback to cache
    }
  }

  const watched: WatchedSummary[] = Object.entries(labelMap).map(([wallet, label]) => {
    const count = GLOBAL_CALLOUT_CACHE.filter((c) => c.callerWallet === wallet).length;
    return { wallet, label, count };
  });

  return NextResponse.json(
    {
      success: true,
      callouts: GLOBAL_CALLOUT_CACHE,
      count: GLOBAL_CALLOUT_CACHE.length,
      watched,
      emptyWallets: [],
      errors: [],
      lastUpdate: LAST_SUCCESSFUL_TS,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
