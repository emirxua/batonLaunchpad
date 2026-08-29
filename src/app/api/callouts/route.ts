import { NextResponse } from "next/server";
import {
  PumpCallout,
  CalloutCard,
  WatchedSummary,
  CalloutsApiResponse,
} from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

export const revalidate = 45;

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

// In-Memory Stale-While-Revalidate Cache
let lastGoodCalloutsCache: (CalloutsApiResponse & { results?: WorkerWalletResult[] }) | null = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();
  const labelMap = getWatchlistMap();

  // Son 20 saniye içindeki isteklerde doğrudan önbelleği dön
  if (
    lastGoodCalloutsCache &&
    lastGoodCalloutsCache.callouts.length > 0 &&
    now - lastFetchTime < 20000
  ) {
    return NextResponse.json(lastGoodCalloutsCache, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
      },
    });
  }

  const proxyUrl =
    process.env.CALLOUT_PROXY_BASE ||
    process.env.NEXT_PUBLIC_CALLOUT_PROXY_URL ||
    "https://pump-callout-proxy.emir1903topuz106.workers.dev/";

  try {
    const res = await fetch(proxyUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 45 },
    });

    if (res.ok) {
      const data = (await res.json()) as WorkerPackageResponse;
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const allCallouts: CalloutCard[] = [];
      const watched: WatchedSummary[] = [];
      const emptyWallets: string[] = [];

      for (const item of rawResults) {
        const wallet = item.wallet;
        const label =
          labelMap[wallet] ??
          DEFAULT_WATCHLIST[wallet] ??
          `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

        const isOk =
          item.ok !== false && (!item.status || item.status === 200);

        if (!isOk) {
          // Worker rate-limited (429) for this wallet -> keep existing count or 0 silently
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

      // Sort newest first
      allCallouts.sort((a, b) => b.createdAt - a.createdAt);

      const payload = {
        updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : now,
        results: rawResults,
        watched,
        callouts:
          allCallouts.length > 0
            ? allCallouts
            : lastGoodCalloutsCache?.callouts || [],
        emptyWallets,
        errors: [], // Asla frontend'e kırmızı 429 hata objesi basma
      };

      if (allCallouts.length > 0) {
        lastGoodCalloutsCache = payload;
        lastFetchTime = now;
      }

      return NextResponse.json(payload, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
        },
      });
    }

    // Upstream 429 / 500 dönerse sessizce son başarılı önbelleği dön
    if (lastGoodCalloutsCache) {
      return NextResponse.json(lastGoodCalloutsCache, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
        },
      });
    }

    return NextResponse.json(
      { results: [], callouts: [], watched: [], emptyWallets: [], errors: [] },
      { status: 200 }
    );
  } catch {
    // Ağ kesintisinde sessiz fallback
    if (lastGoodCalloutsCache) {
      return NextResponse.json(lastGoodCalloutsCache, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
        },
      });
    }

    return NextResponse.json(
      { results: [], callouts: [], watched: [], emptyWallets: [], errors: [] },
      { status: 200 }
    );
  }
}
