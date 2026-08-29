import { NextResponse } from "next/server";
import {
  PumpCallout,
  PumpCalloutListResponse,
  CalloutCard,
  WatchedSummary,
  CalloutError,
  CalloutsApiResponse,
} from "@/lib/types/callouts";
import { getWatchlistWallets, getWatchlistMap } from "@/lib/callouts/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 60;

// ── Config ─────────────────────────────────────────────────────────────────────

const PROXY_BASE =
  process.env.CALLOUT_PROXY_BASE ||
  "https://pump-callout-proxy.emir1903topuz106.workers.dev";

const FETCH_TIMEOUT_MS = 8000;
const BETWEEN_WALLET_DELAY_MS = 400;
const CACHE_TTL_MS = 60_000;

// ── Memory Caches (survives across requests in the same instance) ─────────────

interface WalletCacheEntry {
  callouts: PumpCallout[];
  empty: boolean;
}

const walletCache = new Map<string, { data: WalletCacheEntry; ts: number }>();
let lastGoodPayload: { data: CalloutsApiResponse; ts: number } | null = null;

function getCachedWallet(wallet: string): WalletCacheEntry | null {
  const entry = walletCache.get(wallet);
  return entry ? entry.data : null;
}

function setCachedWallet(wallet: string, data: WalletCacheEntry) {
  walletCache.set(wallet, { data, ts: Date.now() });
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Per-wallet fetch via Worker proxy (?wallet=...) ───────────────────────────

interface WalletResult {
  callouts: PumpCallout[];
  empty: boolean;
  fromCache?: boolean;
  error?: { status?: number; message: string; bodySnippet?: string };
}

async function fetchSingleWallet(wallet: string): Promise<WalletResult> {
  const url = new URL(PROXY_BASE);
  url.searchParams.set("wallet", wallet);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  let text: string;

  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    text = await res.text();
  } catch (err: unknown) {
    clearTimeout(timer);
    const cached = getCachedWallet(wallet);
    if (cached) return { ...cached, fromCache: true };
    return {
      callouts: [],
      empty: true,
      error: {
        message: err instanceof Error ? err.message : "Fetch network failed",
      },
    };
  }
  clearTimeout(timer);

  if (!res.ok) {
    const cached = getCachedWallet(wallet);
    if (cached) return { ...cached, fromCache: true };
    return {
      callouts: [],
      empty: true,
      error: {
        status: res.status,
        message: `Worker HTTP ${res.status}: ${text.slice(0, 150)}`,
        bodySnippet: text.slice(0, 200),
      },
    };
  }

  let data: PumpCalloutListResponse;
  try {
    data = JSON.parse(text) as PumpCalloutListResponse;
  } catch {
    const cached = getCachedWallet(wallet);
    if (cached) return { ...cached, fromCache: true };
    return {
      callouts: [],
      empty: true,
      error: {
        status: res.status,
        message: "JSON parse error from proxy",
        bodySnippet: text.slice(0, 200),
      },
    };
  }

  const calloutsList = Array.isArray(data.callouts) ? data.callouts : [];
  const result: WalletCacheEntry = {
    callouts: calloutsList,
    empty: calloutsList.length === 0,
  };

  setCachedWallet(wallet, result);
  return result;
}

// ── GET handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const now = Date.now();

  // 1. If global cache is fresh (<60s), serve immediately without hitting proxy
  if (lastGoodPayload && now - lastGoodPayload.ts < CACHE_TTL_MS) {
    return NextResponse.json(lastGoodPayload.data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  const wallets = getWatchlistWallets();
  const labelMap = getWatchlistMap();

  const allCallouts: CalloutCard[] = [];
  const watched: WatchedSummary[] = [];
  const emptyWallets: string[] = [];
  const errors: CalloutError[] = [];

  // 2. Sequential for-of loop with 400ms delay between wallets
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const label = labelMap[wallet] ?? `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

    const result = await fetchSingleWallet(wallet);

    if (result.error) {
      errors.push({
        wallet,
        status: result.error.status,
        message: result.fromCache
          ? `${result.error.message} (serving cached data)`
          : result.error.message,
        ...(result.error.bodySnippet ? { bodySnippet: result.error.bodySnippet } : {}),
      });
    }

    if (result.empty && !result.error) {
      emptyWallets.push(wallet);
    }

    watched.push({ wallet, label, count: result.callouts.length });

    for (const c of result.callouts) {
      allCallouts.push({
        ...c,
        callerWallet: wallet,
        callerLabel: label,
      });
    }

    // Await 400ms before next wallet
    if (i < wallets.length - 1) {
      await sleep(BETWEEN_WALLET_DELAY_MS);
    }
  }

  allCallouts.sort((a, b) => b.createdAt - a.createdAt);

  // If widespread failure resulted in 0 callouts but we have an older lastGoodPayload, serve it with warning
  if (allCallouts.length === 0 && lastGoodPayload && lastGoodPayload.data.callouts.length > 0) {
    return NextResponse.json(
      {
        ...lastGoodPayload.data,
        errors: errors.length > 0 ? errors : lastGoodPayload.data.errors,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }

  const response: CalloutsApiResponse = {
    updatedAt: now,
    watched,
    callouts: allCallouts,
    emptyWallets,
    errors,
  };

  // 3. Store successful response in lastGoodPayload
  lastGoodPayload = { data: response, ts: now };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
