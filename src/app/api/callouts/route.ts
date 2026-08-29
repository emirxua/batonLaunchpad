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

// ── Config ─────────────────────────────────────────────────────────────────────

const PROXY_BASE = process.env.CALLOUT_PROXY_BASE ?? "";
const MAX_PAGES = 2;
const FETCH_TIMEOUT_MS = 8000;
/** Wallets fetched sequentially; this delay sits between each one */
const BETWEEN_WALLET_DELAY_MS = 300;
/** Module-level result cache TTL: 60 seconds */
const CACHE_TTL_MS = 60_000;

// ── Module-level memory cache (survives across requests in the same instance) ──

interface WalletCacheEntry {
  callouts: PumpCallout[];
  empty: boolean;
}

const walletCache = new Map<string, { data: WalletCacheEntry; ts: number }>();
let globalResponseCache: { response: CalloutsApiResponse; ts: number } | null = null;

function getCachedWallet(wallet: string): WalletCacheEntry | null {
  const entry = walletCache.get(wallet);
  if (!entry) return null;
  // We allow using stale last-good data on errors
  return entry.data;
}

function setCachedWallet(wallet: string, data: WalletCacheEntry) {
  walletCache.set(wallet, { data, ts: Date.now() });
}

// ── Per-wallet fetch ───────────────────────────────────────────────────────────

interface WalletResult {
  callouts: PumpCallout[];
  empty: boolean;
  fromCache?: boolean;
  error?: { status?: number; message: string; bodySnippet?: string };
}

async function fetchWalletCallouts(wallet: string): Promise<WalletResult> {
  if (!PROXY_BASE) {
    const cached = getCachedWallet(wallet);
    if (cached) return { ...cached, fromCache: true };
    return {
      callouts: [],
      empty: true,
      error: { message: "CALLOUT_PROXY_BASE env not set" },
    };
  }

  const allCallouts: PumpCallout[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(PROXY_BASE);
    url.searchParams.set("wallet", wallet);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    let text: string;
    try {
      res = await fetch(url.toString(), { cache: "no-store", signal: ctrl.signal });
      text = await res.text();
    } catch (err) {
      clearTimeout(timer);
      // Network / timeout — return last-good cache if available
      const cached = getCachedWallet(wallet);
      if (cached) return { ...cached, fromCache: true };
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: { message: err instanceof Error ? err.message : "fetch failed" },
      };
    }
    clearTimeout(timer);

    if (res.status === 429) {
      // Rate limited — fall back to last-good cached data for this wallet
      const cached = getCachedWallet(wallet);
      if (cached) return { ...cached, fromCache: true };
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: {
          status: 429,
          message: "Proxy rate limited (429) — no cached data for this wallet",
          bodySnippet: text.slice(0, 200),
        },
      };
    }

    if (!res.ok) {
      const cached = getCachedWallet(wallet);
      if (cached) return { ...cached, fromCache: true };
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: {
          status: res.status,
          message: `Proxy returned HTTP ${res.status}`,
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
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: {
          status: res.status,
          message: "JSON parse error from proxy",
          bodySnippet: text.slice(0, 200),
        },
      };
    }

    if (Array.isArray(data.callouts)) {
      allCallouts.push(...data.callouts);
    }

    if (!data.nextPageToken || data.nextPageToken.trim() === "") break;
    pageToken = data.nextPageToken;
  }

  // Success — store in per-wallet cache
  const result: WalletCacheEntry = { callouts: allCallouts, empty: allCallouts.length === 0 };
  setCachedWallet(wallet, result);
  return result;
}

// ── Delay helper ───────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── GET handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const now = Date.now();

  // 1. If within 60s of last full response, serve immediately from memory
  if (globalResponseCache && now - globalResponseCache.ts < CACHE_TTL_MS) {
    return NextResponse.json(globalResponseCache.response, {
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

  // 2. Fetch wallets SEQUENTIALLY with 300 ms gap — avoids flooding proxy
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const label = labelMap[wallet] ?? wallet.slice(0, 8) + "…";

    const result = await fetchWalletCallouts(wallet);

    if (result.error) {
      errors.push({
        wallet,
        status: result.error.status,
        message: result.fromCache
          ? `${result.error.message} (serving cached)`
          : result.error.message,
        ...(result.error.bodySnippet ? { bodySnippet: result.error.bodySnippet } : {}),
      });
    }

    // 200 + empty → emptyWallets; 429 with fallback cache → still include callouts
    if (result.empty && !result.error) emptyWallets.push(wallet);

    watched.push({ wallet, label, count: result.callouts.length });

    for (const c of result.callouts) {
      allCallouts.push({ ...c, callerWallet: wallet, callerLabel: label });
    }

    if (i < wallets.length - 1) {
      await sleep(BETWEEN_WALLET_DELAY_MS);
    }
  }

  allCallouts.sort((a, b) => b.createdAt - a.createdAt);

  // If this run produced 0 callouts due to widespread failures, but we have an older global cache, use that
  if (allCallouts.length === 0 && globalResponseCache && globalResponseCache.response.callouts.length > 0) {
    return NextResponse.json(
      {
        ...globalResponseCache.response,
        errors: errors.length > 0 ? errors : globalResponseCache.response.errors,
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

  // Save to global cache
  globalResponseCache = { response, ts: now };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
