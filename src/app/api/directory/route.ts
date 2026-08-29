import { NextResponse } from "next/server";
import { TRACKED_COINS, getFallbackCoins } from "@/lib/tracked-coins";
import { getCoinsMarketData } from "@/lib/dexscreener";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const dynamic = "force-dynamic";
export const revalidate = 15;

const DEFAULT_RPC = "https://rpc.ankr.com/solana";
const rawRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
const rpcUrl =
  rawRpc && (rawRpc.startsWith("http://") || rawRpc.startsWith("https://"))
    ? rawRpc
    : DEFAULT_RPC;

const rawMint = process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS?.trim();
const BATON_MINT = rawMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

const BURN_ADDRESSES = [
  "11111111111111111111111111111111",
  "1nc1nerator11111111111111111111111111111111",
  "dead111111111111111111111111111111111111111",
  "deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
];

let cachedDirectory: Record<string, unknown> | null = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();

  // 15s in-memory cache to prevent upstream rate limiting
  if (cachedDirectory && now - lastFetchTime < 15_000) {
    return NextResponse.json(cachedDirectory, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  }

  try {
    const mintAddresses = TRACKED_COINS.map((c) => c.mintAddress);

    // 1. Fetch live enriched coin market data
    const coins = await getCoinsMarketData(mintAddresses);

    // 2. Fetch live on-chain burned $BATON
    let totalBurned = 0;
    try {
      const connection = new Connection(rpcUrl, "confirmed");
      const mintPubkey = new PublicKey(BATON_MINT);

      for (const burnAddr of BURN_ADDRESSES) {
        try {
          const owner = new PublicKey(burnAddr);
          const ata = await getAssociatedTokenAddress(mintPubkey, owner, true);
          const bal = await connection.getTokenAccountBalance(ata);
          totalBurned += bal.value.uiAmount ?? 0;
        } catch {
          // ATA does not exist / 0 balance
        }
      }
    } catch (e) {
      console.warn("Direct RPC burn check failed, fallback to tracked burns sum:", e);
      totalBurned = coins.reduce((acc, c) => acc + (c.totalBurnedBaton || 0), 0);
    }

    // 3. Sort coins by totalBurnedBaton descending
    const rankedCoins = [...coins].sort(
      (a, b) => (b.totalBurnedBaton || 0) - (a.totalBurnedBaton || 0)
    );

    const top1Coin = rankedCoins[0] || null;
    const activeRooms = coins.filter((c) => (c.volume24h || 0) > 0).length;
    const totalVolume24h = coins.reduce((sum, c) => sum + (c.volume24h || 0), 0);

    const payload = {
      success: true,
      timestamp: now,
      totalBurned: Math.max(totalBurned, coins.reduce((acc, c) => acc + (c.totalBurnedBaton || 0), 0)),
      coins: rankedCoins,
      top1Coin,
      marketOverview: {
        activeRooms,
        totalVolume24h,
        attentionLeaderTicker: top1Coin?.ticker || "BATON",
        attentionLeaderMcap: top1Coin?.marketCap || 0,
      },
    };

    cachedDirectory = payload;
    lastFetchTime = now;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("API /api/directory error:", error);

    const fallbackCoins = getFallbackCoins();
    const fallbackPayload = {
      success: false,
      timestamp: now,
      totalBurned: fallbackCoins.reduce((acc, c) => acc + (c.totalBurnedBaton || 0), 0),
      coins: fallbackCoins,
      top1Coin: fallbackCoins[0] || null,
      marketOverview: {
        activeRooms: fallbackCoins.length,
        totalVolume24h: fallbackCoins.reduce((sum, c) => sum + (c.volume24h || 0), 0),
        attentionLeaderTicker: fallbackCoins[0]?.ticker || "BATON",
        attentionLeaderMcap: fallbackCoins[0]?.marketCap || 0,
      },
    };

    return NextResponse.json(cachedDirectory || fallbackPayload, { status: 200 });
  }
}
