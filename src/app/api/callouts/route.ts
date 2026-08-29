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

const FETCH_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 60_000;

// ── Module-level lastGood memory cache ─────────────────────────────────────────

let lastGoodPayload: { data: CalloutsApiResponse; ts: number } | null = null;

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
      throw new Error(`Worker HTTP ${res.status}: ${text.slice(0, 150)}`);
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

  // 1. Serve directly from in-memory cache if fresh (<60s)
  if (lastGoodPayload && now - lastGoodPayload.ts < CACHE_TTL_MS) {
    return NextResponse.json(lastGoodPayload.data, {
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

      const response: CalloutsApiResponse = {
        updatedAt: now,
        watched,
        callouts: allCallouts,
        emptyWallets,
        errors,
      };

      // Store in module memory as last-good
      lastGoodPayload = { data: response, ts: now };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } else if (workerData.error) {
      throw new Error(workerData.error);
    } else {
      throw new Error("Invalid response format from worker (missing results array)");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown proxy error";

    // 4. Fallback: If Worker returned 429/1015/5xx and lastGood exists, return lastGood + warning
    if (lastGoodPayload) {
      const fallbackResponse: CalloutsApiResponse = {
        ...lastGoodPayload.data,
        errors: [
          ...lastGoodPayload.data.errors,
          {
            wallet: "proxy",
            message: `Proxy rate-limited/error: ${errorMsg} (serving cached last-good feed)`,
          },
        ],
      };

      return NextResponse.json(fallbackResponse, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    // 5. If no lastGood exists, return honest error state — NO fake/mock rows
    const emptyResponse: CalloutsApiResponse = {
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
    };

    return NextResponse.json(emptyResponse, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}
