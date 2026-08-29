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

const BASE_URL = "https://frontend-api-v3.pump.fun";
const MAX_PAGES = 2;

const FETCH_HEADERS = {
  Accept: "application/json",
  Origin: "https://pump.fun",
  Referer: "https://pump.fun/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};

/**
 * Fetch up to MAX_PAGES pages of callouts for a single wallet.
 * Returns { callouts, empty, error }
 */
async function fetchWalletCallouts(
  wallet: string
): Promise<{
  callouts: PumpCallout[];
  empty: boolean;
  error?: { status?: number; message: string };
}> {
  const allCallouts: PumpCallout[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${BASE_URL}/callout/list/${wallet}`);
    url.searchParams.set("sortBy", "TIMESTAMP");
    url.searchParams.set("sortOrder", "DESC");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url.toString(), {
        headers: FETCH_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        return {
          callouts: allCallouts,
          empty: allCallouts.length === 0,
          error: {
            status: res.status,
            message: `HTTP ${res.status} from ${url.toString()}`,
          },
        };
      }

      const data: PumpCalloutListResponse = await res.json();

      if (Array.isArray(data.callouts)) {
        allCallouts.push(...data.callouts);
      }

      // Stop pagination if no next page token or empty token
      if (!data.nextPageToken || data.nextPageToken.trim() === "") {
        break;
      }

      pageToken = data.nextPageToken;
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : "Fetch failed";
      return {
        callouts: allCallouts,
        empty: allCallouts.length === 0,
        error: { message: msg },
      };
    }
  }

  return {
    callouts: allCallouts,
    empty: allCallouts.length === 0,
  };
}

export async function GET() {
  const wallets = getWatchlistWallets();
  const labelMap = getWatchlistMap();

  const allCallouts: CalloutCard[] = [];
  const watched: WatchedSummary[] = [];
  const emptyWallets: string[] = [];
  const errors: CalloutError[] = [];

  // Fetch all wallets in parallel
  const results = await Promise.allSettled(
    wallets.map(async (wallet) => ({
      wallet,
      label: labelMap[wallet] ?? wallet.slice(0, 8) + "…",
      ...(await fetchWalletCallouts(wallet)),
    }))
  );

  for (const result of results) {
    if (result.status === "rejected") {
      // Should not happen since fetchWalletCallouts never throws
      errors.push({ wallet: "unknown", message: String(result.reason) });
      continue;
    }

    const { wallet, label, callouts, empty, error } = result.value;

    if (error) {
      errors.push({ wallet, status: error.status, message: error.message });
    }

    if (empty) {
      emptyWallets.push(wallet);
    }

    watched.push({ wallet, label, count: callouts.length });

    for (const c of callouts) {
      allCallouts.push({
        ...c,
        callerWallet: wallet,
        callerLabel: label,
      });
    }
  }

  // Sort merged callouts by createdAt DESC
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
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
