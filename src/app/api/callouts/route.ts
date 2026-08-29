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

// ── Config ────────────────────────────────────────────────────────────────────

const PROXY_BASE = process.env.CALLOUT_PROXY_BASE ?? "";
const MAX_PAGES = 2;
const FETCH_TIMEOUT_MS = 8000;

// ── Per-wallet fetch via CF Worker proxy ──────────────────────────────────────

interface WalletResult {
  callouts: PumpCallout[];
  empty: boolean;
  error?: { status?: number; message: string; bodySnippet?: string };
}

async function fetchWalletCallouts(wallet: string): Promise<WalletResult> {
  if (!PROXY_BASE) {
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
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: { message: err instanceof Error ? err.message : "fetch failed" },
      };
    }
    clearTimeout(timer);

    if (!res.ok) {
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

  return { callouts: allCallouts, empty: allCallouts.length === 0 };
}

// ── Batch runner: N items per batch, delayMs between batches ─────────────────

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise<void>((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const wallets = getWatchlistWallets();
  const labelMap = getWatchlistMap();

  const allCallouts: CalloutCard[] = [];
  const watched: WatchedSummary[] = [];
  const emptyWallets: string[] = [];
  const errors: CalloutError[] = [];

  // 3-wallet batches, 200 ms gap — keeps Worker request rate sane
  const rawResults = await runInBatches(
    wallets,
    3,
    200,
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

    const { wallet, label, callouts, empty, error } = result.value;

    if (error) {
      errors.push({
        wallet,
        status: error.status,
        message: error.message,
        ...(error.bodySnippet ? { bodySnippet: error.bodySnippet } : {}),
      });
    }

    // 200 + empty array → emptyWallets (e.g. alonalon), NOT an error
    if (empty && !error) emptyWallets.push(wallet);

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
    headers: {
      // 30 s shared cache → Vercel Edge caches between user requests,
      // stale-while-revalidate keeps UI snappy while fresh fetch runs.
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59",
    },
  });
}
