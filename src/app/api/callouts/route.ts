import { NextResponse } from "next/server";
import {
  PumpCallout,
  CalloutCard,
  WatchedSummary,
  CalloutError,
  CalloutsApiResponse,
} from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 60;

// ── Config ─────────────────────────────────────────────────────────────────────

const PROXY_BASE =
  process.env.CALLOUT_PROXY_BASE ||
  "https://pump-callout-proxy.emir1903topuz106.workers.dev/";

const FETCH_TIMEOUT_MS = 9000;
const CACHE_TTL_MS = 60_000;

// ── SIKIYÖNETİM CACHE (Survives across all requests in the process) ─────────────

let memoryCache: { timestamp: number; payload: (CalloutsApiResponse & { isStale?: boolean }) | null } = {
  timestamp: 0,
  payload: null,
};

// ── Worker Response Schema ─────────────────────────────────────────────────────

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

// ── Single Outbound Fetch to Worker ───────────────────────────────────────────

async function fetchAllCalloutsFromWorker(): Promise<WorkerPackageResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(PROXY_BASE, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: ctrl.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Worker HTTP ${res.status}: ${text.slice(0, 120)}`);
    }

    const data = JSON.parse(text) as WorkerPackageResponse;
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ── GET Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const now = Date.now();

  // 1. If memoryCache is fresh (<60s), DO NOT touch the proxy at all
  if (memoryCache.payload && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(memoryCache.payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  const labelMap = getWatchlistMap();
  const allCallouts: CalloutCard[] = [];
  const watched: WatchedSummary[] = [];
  const emptyWallets: string[] = [];
  const errors: CalloutError[] = [];

  try {
    // 2. Perform EXACTLY ONE fetch to Worker
    const workerData = await fetchAllCalloutsFromWorker();

    if (Array.isArray(workerData.results)) {
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
            message: item.error || `Worker returned status ${item.status}`,
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

      const response: CalloutsApiResponse & { isStale?: boolean } = {
        updatedAt: now,
        watched,
        callouts: allCallouts,
        emptyWallets,
        errors,
        isStale: false,
      };

      // 4. Update memory cache
      memoryCache = { timestamp: now, payload: response };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } else {
      throw new Error("Invalid response format from worker (missing results array)");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Proxy fetch error";
    console.warn("Worker proxy error:", errorMsg);

    // 5. ASLA SIFIRLAMA KURALI (Fail-Safe):
    // If Worker returned 429/500/network error and memoryCache exists:
    // Return last good data with isStale: true. NEVER drop existing callouts!
    if (memoryCache.payload) {
      const fallbackPayload: CalloutsApiResponse & { isStale?: boolean } = {
        ...memoryCache.payload,
        isStale: true,
      };

      return NextResponse.json(fallbackPayload, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    // 6. Only when server has zero data at cold boot, return clean empty list
    const emptyResponse: CalloutsApiResponse & { isStale?: boolean } = {
      updatedAt: now,
      watched: Object.entries(labelMap).map(([wallet, label]) => ({
        wallet,
        label,
        count: 0,
      })),
      callouts: [],
      emptyWallets: [],
      errors: [
        {
          wallet: "proxy",
          message: errorMsg,
        },
      ],
      isStale: true,
    };

    return NextResponse.json(emptyResponse, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}
