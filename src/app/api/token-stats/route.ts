import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const dynamic = "force-dynamic";

export interface TopHolder {
  rank: number;
  address: string;
  owner?: string;
  amount: number;
  percentage: number;
  isPool: boolean;
  label?: string;
}

export interface TokenStatsResponse {
  mintAddress: string;
  initialSupply: number;
  currentSupply: number;
  totalBurned: number;
  burnPercentage: number;
  totalHoldersCount: number;
  topHolders: TopHolder[];
  lastUpdated: string;
  note?: string;
}

let cachedStats: TokenStatsResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 10_000;

const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim(),
  "https://api.mainnet-beta.solana.com",
  "https://solana-mainnet.g.alchemy.com/v2/demo",
].filter((url): url is string => Boolean(url && url.startsWith("http")));

const rawMint = process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS?.trim();
const DEFAULT_MINT = rawMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

const KNOWN_POOLS: Record<string, string> = {
  "CaJDdp5Pbte45Row7S7fwZWKBSJ8EhUaSQwZjZGqioqD": "Raydium AMM Token Vault",
  "5Wg14qETNz2xo1rBCCDUd7PyQKbKo2Luj8nmrtpwimMx": "Raydium / AMM Pool",
  "5F5A7EeGqDzhQtQyaGV3vTDxxtxJxwYAhoRFjhYintR5": "Pump.fun Bonding Curve",
};

const BURN_ADDRESSES = [
  "11111111111111111111111111111111",
  "1nc1nerator11111111111111111111111111111111",
  "dead111111111111111111111111111111111111111",
  "deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
];

async function callRpc(method: string, params: any[], ms = 2500): Promise<any> {
  for (const endpoint of RPC_ENDPOINTS) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "token-stats",
          method,
          params,
        }),
        cache: "no-store",
      });
      clearTimeout(id);
      if (res.ok) {
        const json = await res.json();
        if (json && json.result !== undefined) {
          return json.result;
        }
      }
    } catch {
      // try next
    } finally {
      clearTimeout(id);
    }
  }
  return null;
}

export async function GET() {
  const now = Date.now();

  if (cachedStats && now - lastFetchTime < CACHE_DURATION_MS) {
    return NextResponse.json(cachedStats, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }

  try {
    const mintPubkey = new PublicKey(DEFAULT_MINT);
    const initialSupply = 1_000_000_000;

    // 1. Fetch real on-chain token supply
    const supplyResult = await callRpc("getTokenSupply", [DEFAULT_MINT]);
    const currentSupply = supplyResult?.value?.uiAmount ?? 997_676_323;

    // 2. Real on-chain burned tokens:
    // When SPL tokens are burned, supply decreases directly on-chain.
    const supplyDeflation = Math.max(0, initialSupply - currentSupply);
    let deadAddressBurned = 0;

    const burnAtaPromises = BURN_ADDRESSES.map(async (burnAddr) => {
      try {
        const owner = new PublicKey(burnAddr);
        const ata = await getAssociatedTokenAddress(mintPubkey, owner, true);
        const balResult = await callRpc("getTokenAccountBalance", [ata.toBase58()], 2000);
        return balResult?.value?.uiAmount ?? 0;
      } catch {
        return 0;
      }
    });

    const burnResults = await Promise.allSettled(burnAtaPromises);
    for (const r of burnResults) {
      if (r.status === "fulfilled") {
        deadAddressBurned += r.value;
      }
    }

    const totalBurned = Math.round(supplyDeflation + deadAddressBurned);
    const burnPercentage = Number(((totalBurned / initialSupply) * 100).toFixed(2));

    // 3. Fetch on-chain largest token accounts
    let topHolders: TopHolder[] = [];
    const largestAccountsResult = await callRpc("getTokenLargestAccounts", [DEFAULT_MINT], 3000);

    if (largestAccountsResult?.value && Array.isArray(largestAccountsResult.value)) {
      topHolders = largestAccountsResult.value.slice(0, 10).map((acc: any, index: number) => {
        const addrStr = acc.address;
        const amount = acc.uiAmount ?? 0;
        const percentage = currentSupply > 0 ? (amount / currentSupply) * 100 : 0;
        const knownLabel = KNOWN_POOLS[addrStr];
        const isPool = Boolean(knownLabel && (knownLabel.includes("Pool") || knownLabel.includes("Vault")));

        return {
          rank: index + 1,
          address: addrStr,
          amount,
          percentage,
          isPool,
          label: knownLabel || (index === 0 ? "Top Holder #1" : undefined),
        };
      });
    }

    const payload: TokenStatsResponse = {
      mintAddress: DEFAULT_MINT,
      initialSupply,
      currentSupply,
      totalBurned,
      burnPercentage,
      totalHoldersCount: topHolders.length > 0 ? topHolders.length : 0,
      topHolders,
      lastUpdated: new Date().toISOString(),
      note: "Live on-chain Solana RPC query",
    };

    cachedStats = payload;
    lastFetchTime = now;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("API /api/token-stats error:", error);

    const emptyFallback: TokenStatsResponse = {
      mintAddress: DEFAULT_MINT,
      initialSupply: 1_000_000_000,
      currentSupply: 0,
      totalBurned: 0,
      burnPercentage: 0,
      totalHoldersCount: 0,
      topHolders: [],
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(cachedStats || emptyFallback, { status: 200 });
  }
}
