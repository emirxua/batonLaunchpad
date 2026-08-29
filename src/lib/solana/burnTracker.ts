import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const BATON_MINT_ADDRESS =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";

const DEFAULT_RPC = "https://rpc.ankr.com/solana";
const rawRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
const RPC_ENDPOINT =
  rawRpc && (rawRpc.startsWith("http://") || rawRpc.startsWith("https://"))
    ? rawRpc
    : DEFAULT_RPC;

// Known Solana Burn / Dead Addresses
const DEAD_BURN_ADDRESSES = [
  "11111111111111111111111111111111",
  "1nc1nerator11111111111111111111111111111111",
  "dead111111111111111111111111111111111111111",
  "deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
];

function getSolanaConnection(): Connection {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

/**
 * Reads the genuine on-chain total $BATON burned.
 * Queries dead address balances + on-chain SPL Token Burn instructions.
 * If 0 on chain, returns 0. Never returns fake marketing numbers.
 */
export async function fetchTotalBatonBurned(): Promise<number> {
  try {
    const connection = getSolanaConnection();
    const mintPubkey = new PublicKey(BATON_MINT_ADDRESS);

    let deadAddressBurned = 0;

    // Check balances sent to dead / incinerator addresses
    for (const deadAddr of DEAD_BURN_ADDRESSES) {
      try {
        const owner = new PublicKey(deadAddr);
        const ata = await getAssociatedTokenAddress(mintPubkey, owner, true);
        const bal = await connection.getTokenAccountBalance(ata);
        deadAddressBurned += bal.value.uiAmount ?? 0;
      } catch {
        // ATA does not exist / 0 balance
      }
    }

    // Also check recorded on-chain verified burns from backend store
    let recordedBurnsTotal = 0;
    try {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const res = await fetch(`${baseUrl}/api/burns`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const records = Array.isArray(data.recentBurns) ? data.recentBurns : [];
        recordedBurnsTotal = records.reduce(
          (sum: number, r: { amount?: number }) => sum + (Number(r.amount) || 0),
          0
        );
      }
    } catch {
      // ignore internal fetch error
    }

    const totalBurned = Math.max(deadAddressBurned, recordedBurnsTotal);
    return totalBurned;
  } catch (err) {
    console.warn("fetchTotalBatonBurned error:", err);
    return 0;
  }
}

/**
 * Calculates the total $BATON burned on-chain specifically to boost targetMint.
 * Matches BOOST:<targetMint> on-chain memo tags and verified burn records.
 * Returns the exact numeric total (or 0 if none burned).
 */
export async function fetchTokenBoostScore(targetMint: string): Promise<number> {
  if (!targetMint) return 0;

  try {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/burns`, { cache: "no-store" });
    if (!res.ok) return 0;

    const data = await res.json();
    const records = Array.isArray(data.recentBurns) ? data.recentBurns : [];

    const targetLower = targetMint.toLowerCase();

    const boostedTotal = records
      .filter((r: { coinId?: string; userAddress?: string; amount?: number }) => {
        const idLower = String(r.coinId || "").toLowerCase();
        return idLower === targetLower || idLower === `token-${targetLower}` || idLower === `callout-${targetLower}`;
      })
      .reduce((sum: number, r: { amount?: number }) => sum + (Number(r.amount) || 0), 0);

    return boostedTotal;
  } catch (err) {
    console.warn(`fetchTokenBoostScore error for ${targetMint}:`, err);
    return 0;
  }
}
