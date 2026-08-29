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
export const revalidate = 90;

// ── Config ─────────────────────────────────────────────────────────────────────

const PROXY_BASE =
  process.env.CALLOUT_PROXY_BASE ||
  "https://pump-callout-proxy.emir1903topuz106.workers.dev";

const FETCH_TIMEOUT_MS = 8000;
/** 650ms throttling delay between sequential wallet requests */
const BETWEEN_WALLET_DELAY_MS = 650;
/** 1000ms retry delay on 429 rate limit */
const RETRY_BACKOFF_MS = 1000;
/** 90 seconds module memory cache TTL */
const CACHE_TTL_MS = 90_000;

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

// ── Per-wallet fetch via Worker proxy with 429 Retry ───────────────────────────

interface WalletResult {
  callouts: PumpCallout[];
  empty: boolean;
  fromCache?: boolean;
  error?: { status?: number; message: string; bodySnippet?: string };
}

async function doFetchWallet(wallet: string): Promise<{ ok: boolean; status: number; text: string; data?: PumpCalloutListResponse }> {
  const url = new URL(PROXY_BASE);
  url.searchParams.set("wallet", wallet);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data: PumpCalloutListResponse | undefined;
    if (res.ok) {
      try {
        data = JSON.parse(text) as PumpCalloutListResponse;
      } catch {
        // json parse failed
      }
    }
    return { ok: res.ok, status: res.status, text, data };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSingleWalletWithRetry(wallet: string): Promise<WalletResult> {
  let attemptResult: { ok: boolean; status: number; text: string; data?: PumpCalloutListResponse };

  try {
    attemptResult = await doFetchWallet(wallet);
  } catch (err: unknown) {
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

  // If 429 Rate Limited, backoff for 1s and retry 1 time
  if (attemptResult.status === 429) {
    await sleep(RETRY_BACKOFF_MS);
    try {
      attemptResult = await doFetchWallet(wallet);
    } catch {
      // ignore, fall through to check ok
    }
  }

  if (!attemptResult.ok || !attemptResult.data) {
    const cached = getCachedWallet(wallet);
    if (cached) return { ...cached, fromCache: true };
    return {
      callouts: [],
      empty: true,
      error: {
        status: attemptResult.status,
        message: `Worker HTTP ${attemptResult.status}: ${attemptResult.text.slice(0, 150)}`,
        bodySnippet: attemptResult.text.slice(0, 200),
      },
    };
  }

  const calloutsList = Array.isArray(attemptResult.data.callouts)
    ? attemptResult.data.callouts
    : [];

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

  // 1. If global cache is fresh (<90s), serve immediately from memory without proxy requests
  if (lastGoodPayload && now - lastGoodPayload.ts < CACHE_TTL_MS) {
    return NextResponse.json(lastGoodPayload.data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
      },
    });
  }

  const wallets = getWatchlistWallets();
  const labelMap = getWatchlistMap();

  const allCallouts: CalloutCard[] = [];
  const watched: WatchedSummary[] = [];
  const emptyWallets: string[] = [];
  const errors: CalloutError[] = [];

  // 2. Sequential for-of loop with 650ms delay between wallets
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const label = labelMap[wallet] ?? `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

    const result = await fetchSingleWalletWithRetry(wallet);

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

    // Await 650ms before next wallet
    if (i < wallets.length - 1) {
      await sleep(BETWEEN_WALLET_DELAY_MS);
    }
  }

  allCallouts.sort((a, b) => b.createdAt - a.createdAt);

  // If widespread failure resulted in 0 callouts but we have an older lastGoodPayload, serve it
  if (allCallouts.length === 0 && lastGoodPayload && lastGoodPayload.data.callouts.length > 0) {
    return NextResponse.json(
      {
        ...lastGoodPayload.data,
        errors: errors.length > 0 ? errors : lastGoodPayload.data.errors,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
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

  // 3. Store successful response in lastGoodPayload with 90s TTL
  lastGoodPayload = { data: response, ts: now };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=90, stale-while-revalidate=180",
    },
  });
}
