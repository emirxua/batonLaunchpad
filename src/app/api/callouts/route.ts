import { NextResponse } from "next/server";
import {
  PumpCallout,
  CalloutCard,
  WatchedSummary,
  CalloutError,
  CalloutsApiResponse,
} from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

export const revalidate = 90;

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

// Fail-safe cache that survives across requests
let lastGoodCalloutsCache: (CalloutsApiResponse & { results?: WorkerWalletResult[] }) | null = null;

export async function GET() {
  const now = Date.now();
  const labelMap = getWatchlistMap();
  const proxyUrl =
    process.env.CALLOUT_PROXY_BASE ||
    process.env.NEXT_PUBLIC_CALLOUT_PROXY_URL ||
    "https://pump-callout-proxy.emir1903topuz106.workers.dev/";

  try {
    const res = await fetch(proxyUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 90 },
    });

    if (res.ok) {
      const data = (await res.json()) as WorkerPackageResponse;
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const allCallouts: CalloutCard[] = [];
      const watched: WatchedSummary[] = [];
      const emptyWallets: string[] = [];
      const errors: CalloutError[] = [];

      for (const item of rawResults) {
        const wallet = item.wallet;
        const label =
          labelMap[wallet] ??
          DEFAULT_WATCHLIST[wallet] ??
          `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

        const isOk =
          item.ok !== false && (!item.status || item.status === 200);

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

      // Sort newest callouts first
      allCallouts.sort((a, b) => b.createdAt - a.createdAt);

      const payload = {
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : now,
        results: rawResults,
        watched,
        callouts: allCallouts,
        emptyWallets,
        errors,
      };

      if (rawResults.length > 0) {
        lastGoodCalloutsCache = payload;
      }

      return NextResponse.json(payload, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
        },
      });
    }

    // Proxy 429 veya hata dönerse son veriyi koru
    if (lastGoodCalloutsCache) {
      return NextResponse.json(lastGoodCalloutsCache, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
        },
      });
    }

    return NextResponse.json(
      { results: [], callouts: [], watched: [], emptyWallets: [], errors: [{ wallet: "proxy", message: "Proxy cooldown" }] },
      { status: 200 }
    );
  } catch {
    // Fail-safe error catch
    if (lastGoodCalloutsCache) {
      return NextResponse.json(lastGoodCalloutsCache, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
        },
      });
    }

    return NextResponse.json(
      { results: [], callouts: [], watched: [], emptyWallets: [], errors: [{ wallet: "proxy", message: "Service unavailable" }] },
      { status: 200 }
    );
  }
}
