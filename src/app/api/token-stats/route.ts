import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

export const dynamic = "force-dynamic";

export interface TopHolder {
  rank: number;
  address: string;
  owner: string;
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
}

let cachedStats: TokenStatsResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 15_000;
const DEFAULT_RPC = "https://rpc.ankr.com/solana";
const rawRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
const rpcUrl = rawRpc && (rawRpc.startsWith("http://") || rawRpc.startsWith("https://")) ? rawRpc : DEFAULT_RPC;

const rawMint = process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS?.trim();
const DEFAULT_MINT = rawMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
const KNOWN_POOL_ADDRESSES = [
  "5Wg14qETNz2xo1rBCCDUd7PyQKbKo2Luj8nmrtpwimMx",
  "5F5A7EeGqDzhQtQyaGV3vTDxxtxJxwYAhoRFjhYintR5",
];

export async function GET() {
  const now = Date.now();

  if (cachedStats && now - lastFetchTime < CACHE_DURATION_MS) {
    return NextResponse.json(cachedStats, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  }

  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const mintPubkey = new PublicKey(DEFAULT_MINT);

    // 1. Fetch real on-chain token supply
    const supplyResponse = await connection.getTokenSupply(mintPubkey);
    const currentSupply = supplyResponse.value.uiAmount ?? 1_000_000_000;
    const initialSupply = 1_000_000_000;
    const totalBurned = Math.max(0, initialSupply - currentSupply);
    const burnPercentage = (totalBurned / initialSupply) * 100;

    // 2. Fetch on-chain token accounts
    let topHolders: TopHolder[] = [];
    let totalHoldersCount = 0;

    try {
      const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mintPubkey.toBase58() } },
        ],
      });

      totalHoldersCount = accounts.length;

      const parsedAccounts = accounts
        .map((a) => {
          const decoded = AccountLayout.decode(a.account.data);
          const amount = Number(decoded.amount) / 1e6;
          const owner = decoded.owner.toBase58();
          const isPool = KNOWN_POOL_ADDRESSES.includes(owner) || KNOWN_POOL_ADDRESSES.includes(a.pubkey.toBase58());

          return {
            address: a.pubkey.toBase58(),
            owner,
            amount,
            isPool,
          };
        })
        .filter((a) => a.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      topHolders = parsedAccounts.slice(0, 10).map((holder, index) => ({
        rank: index + 1,
        address: holder.address,
        owner: holder.owner,
        amount: holder.amount,
        percentage: (holder.amount / initialSupply) * 100,
        isPool: holder.isPool,
        label: holder.isPool ? "Raydium / AMM Pool" : index === 1 ? "Top Whale #1" : undefined,
      }));
    } catch (accErr) {
      console.warn("getProgramAccounts error:", accErr);
      if (cachedStats?.topHolders) {
        topHolders = cachedStats.topHolders;
        totalHoldersCount = cachedStats.totalHoldersCount;
      }
    }

    const result: TokenStatsResponse = {
      mintAddress: DEFAULT_MINT,
      initialSupply,
      currentSupply,
      totalBurned,
      burnPercentage,
      totalHoldersCount,
      topHolders,
      lastUpdated: new Date().toISOString(),
    };

    cachedStats = result;
    lastFetchTime = now;

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Error fetching on-chain token stats:", error);

    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    return NextResponse.json(
      {
        mintAddress: DEFAULT_MINT,
        initialSupply: 1_000_000_000,
        currentSupply: 1_000_000_000,
        totalBurned: 0,
        burnPercentage: 0,
        totalHoldersCount: 0,
        topHolders: [],
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
