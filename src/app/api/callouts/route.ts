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
export const revalidate = 0;

// ── Headers that mimic a browser hitting pump.fun ─────────────────────────────
// Do NOT add Authorization, Cookie, or any batonoutbid.icu/vercel.app Origin.
const PUMP_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://pump.fun",
  Referer: "https://pump.fun/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

// Fallback base-URLs tried in order when v3 returns non-2xx
const BASE_URLS = [
  "https://frontend-api-v3.pump.fun",
  "https://frontend-api.pump.fun",
  "https://frontend-api-v2.pump.fun",
];

const MAX_PAGES = 2;
const FETCH_TIMEOUT_MS = 7000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(base: string, wallet: string, pageToken?: string): string {
  const u = new URL(`${base}/callout/list/${wallet}`);
  u.searchParams.set("sortBy", "TIMESTAMP");
  u.searchParams.set("sortOrder", "DESC");
  if (pageToken) u.searchParams.set("pageToken", pageToken);
  return u.toString();
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "GET",
      headers: PUMP_HEADERS,
      cache: "no-store",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Try each BASE_URL in order; return first successful response or last failure */
async function fetchWithFallback(
  wallet: string,
  pageToken?: string
): Promise<{
  res: Response | null;
  text: string;
  triedUrl: string;
  cfRay: string | null;
}> {
  let lastText = "";
  let lastCfRay: string | null = null;
  let lastUrl = "";

  for (const base of BASE_URLS) {
    const url = buildUrl(base, wallet, pageToken);
    lastUrl = url;
    try {
      const res = await fetchWithTimeout(url);
      lastCfRay = res.headers.get("cf-ray");
      const text = await res.text();
      if (res.ok) return { res, text, triedUrl: url, cfRay: lastCfRay };
      lastText = text;
    } catch (err) {
      lastText = err instanceof Error ? err.message : String(err);
    }
  }

  return { res: null, text: lastText, triedUrl: lastUrl, cfRay: lastCfRay };
}

// ── Per-wallet fetcher ────────────────────────────────────────────────────────

interface WalletResult {
  callouts: PumpCallout[];
  empty: boolean;
  error?: { status?: number; message: string; bodySnippet?: string; cfRay?: string | null };
}

async function fetchWalletCallouts(wallet: string): Promise<WalletResult> {
  const allCallouts: PumpCallout[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { res, text, cfRay } = await fetchWithFallback(wallet, pageToken);

    if (!res) {
      // All bases failed
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: {
          message: "All fallback URLs failed",
          bodySnippet: text.slice(0, 200),
          cfRay,
        },
      };
    }

    let data: PumpCalloutListResponse;
    try {
      data = JSON.parse(text) as PumpCalloutListResponse;
    } catch {
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: {
          status: res.status,
          message: "JSON parse error",
          bodySnippet: text.slice(0, 200),
          cfRay,
        },
      };
    }

    if (Array.isArray(data.callouts)) {
      allCallouts.push(...data.callouts);
    }

    if (!data.nextPageToken || data.nextPageToken.trim() === "") break;
    pageToken = data.nextPageToken;
  }

  return { callouts: allCallouts, empty: allCallouts.length === 0 };
}

// ── Batch helper: run in groups of N with delay between batches ───────────────

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  delayMs: number,
  fn: (item: T) => Promise<unknown>
): Promise<PromiseSettledResult<unknown>[]> {
  const results: PromiseSettledResult<unknown>[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const wallets = getWatchlistWallets();
  const labelMap = getWatchlistMap();

  const allCallouts: CalloutCard[] = [];
  const watched: WatchedSummary[] = [];
  const emptyWallets: string[] = [];
  const errors: CalloutError[] = [];

  // Batch 3 wallets at a time, 250 ms between batches — avoids Cloudflare WAF
  const rawResults = await runInBatches(
    wallets,
    3,
    250,
    async (wallet) => ({
      wallet,
      label: labelMap[wallet] ?? wallet.slice(0, 8) + "…",
      ...(await fetchWalletCallouts(wallet)),
    })
  );

  for (const result of rawResults) {
    if (result.status === "rejected") {
      errors.push({ wallet: "unknown", message: String(result.reason) });
      continue;
    }

    const val = result.value as {
      wallet: string;
      label: string;
      callouts: PumpCallout[];
      empty: boolean;
      error?: { status?: number; message: string; bodySnippet?: string; cfRay?: string | null };
    };

    const { wallet, label, callouts, empty, error } = val;

    if (error) {
      errors.push({
        wallet,
        status: error.status,
        message: error.message,
        ...(error.bodySnippet ? { bodySnippet: error.bodySnippet } : {}),
        ...(error.cfRay ? { cfRay: error.cfRay } : {}),
      });
    }

    if (empty) emptyWallets.push(wallet);

    watched.push({ wallet, label, count: callouts.length });

    for (const c of callouts) {
      allCallouts.push({ ...c, callerWallet: wallet, callerLabel: label });
    }
  }

  allCallouts.sort((a, b) => b.createdAt - a.createdAt);

  const response: CalloutsApiResponse = {
    updatedAt: Date.now(),
    watched,
    callouts: allCallouts,
    emptyWallets,
    errors,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
