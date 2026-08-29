import { NextResponse } from "next/server";
import {
  PumpCallout,
  CalloutCard,
  WatchedSummary,
  CalloutError,
  CalloutsApiResponse,
} from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

// Next.js ISR: Cache this route on the server/edge for 90 seconds
export const revalidate = 90;

const PROXY_BASE =
  process.env.CALLOUT_PROXY_BASE ||
  "https://pump-callout-proxy.emir1903topuz106.workers.dev/";

// Fallback in-memory cache in case of edge network drops
let memoryCache: CalloutsApiResponse | null = null;

interface WorkerWalletResult {
  wallet: string;
  ok?: boolean;
  status?: number;
  callouts?: PumpCallout[];
  error?: string;
}

interface WorkerPackageResponse {
  updatedAt?: string | number;
  results?: WorkerWalletResult[];
  error?: string;
}

export async function GET() {
  const now = Date.now();
  const labelMap = getWatchlistMap();

  try {
    // 1. Single ISR fetch to Worker with 90s cache
    const res = await fetch(PROXY_BASE, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 90 },
    });

    if (!res.ok) {
      throw new Error(`Worker HTTP ${res.status}`);
    }

    const workerData = (await res.json()) as WorkerPackageResponse;

    if (!Array.isArray(workerData.results)) {
      throw new Error("Invalid response format: missing results array");
    }

    const allCallouts: CalloutCard[] = [];
    const watched: WatchedSummary[] = [];
    const emptyWallets: string[] = [];
    const errors: CalloutError[] = [];

    // 2. Parse and combine callouts from all 10 wallets
    for (const item of workerData.results) {
      const wallet = item.wallet;
      const label =
        labelMap[wallet] ??
        DEFAULT_WATCHLIST[wallet] ??
        `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

      const isOk = item.ok !== false && (!item.status || item.status === 200);

      if (!isOk) {
        errors.push({
          wallet,
          status: item.status ?? 500,
          message: item.error || `Worker status ${item.status}`,
        });
        watched.push({ wallet, label, count: 0 });
        continue;
      }

      const calloutsList = Array.isArray(item.callouts) ? item.callouts : [];
      const count = calloutsList.length;

      watched.push({ wallet, label, count });

      if (count === 0) {
        emptyWallets.push(wallet);
      } else {
        for (const c of calloutsList) {
          allCallouts.push({
            ...c,
            callerWallet: wallet,
            callerLabel: label,
          });
        }
      }
    }

    // 3. Sort all callouts newest first (createdAt DESC)
    allCallouts.sort((a, b) => b.createdAt - a.createdAt);

    const payload: CalloutsApiResponse = {
      updatedAt: now,
      watched,
      callouts: allCallouts,
      emptyWallets,
      errors,
    };

    memoryCache = payload;

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Proxy fetch error";

    // 4. Fail-safe: If Worker fails and previous cache exists, return it without wiping out UI
    if (memoryCache) {
      return NextResponse.json(
        {
          ...memoryCache,
          errors: [
            ...memoryCache.errors,
            { wallet: "proxy", message: `${errorMsg} (serving cached)` },
          ],
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
          },
        }
      );
    }

    // 5. Cold boot fallback (no mock data)
    return NextResponse.json(
      {
        updatedAt: now,
        watched: Object.entries(labelMap).map(([wallet, label]) => ({
          wallet,
          label,
          count: 0,
        })),
        callouts: [],
        emptyWallets: [],
        errors: [{ wallet: "proxy", message: errorMsg }],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
        },
      }
    );
  }
}
