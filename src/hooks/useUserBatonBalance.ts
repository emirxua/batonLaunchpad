"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { OFFICIAL_BATON_MINT } from "@/lib/solana-burn";

const BATON_TOKEN_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS || OFFICIAL_BATON_MINT;

export interface UserBalanceState {
  solBalance: number | null;
  batonBalance: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserBatonBalance(tokenMintAddress: string = BATON_TOKEN_MINT): UserBalanceState {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [batonBalance, setBatonBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(null);
      setBatonBalance(null);
      setError(null);
      return;
    }

    try {
      // 1. Primary: Server-side high-speed balance route
      try {
        const res = await fetch(
          `/api/wallet-balance?wallet=${encodeURIComponent(publicKey.toBase58())}&mint=${encodeURIComponent(tokenMintAddress)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (typeof data.solBalance === "number") setSolBalance(data.solBalance);
          if (typeof data.tokenBalance === "number") setBatonBalance(data.tokenBalance);
          setError(null);
          return;
        }
      } catch {
        // Fallback to direct connection if internal API unavailable
      }

      // 2. Fallback: Direct Solana connection
      if (connection) {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        setSolBalance(lamports / LAMPORTS_PER_SOL);

        try {
          const tokenMintKey = new PublicKey(tokenMintAddress);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: tokenMintKey },
            "confirmed"
          );

          if (tokenAccounts.value && tokenAccounts.value.length > 0) {
            const totalTokenAmount = tokenAccounts.value.reduce((acc, account) => {
              const amount =
                account.account.data.parsed.info.tokenAmount.uiAmount || 0;
              return acc + amount;
            }, 0);
            setBatonBalance(totalTokenAmount);
          } else {
            setBatonBalance(0);
          }
        } catch {
          setBatonBalance(0);
        }
      }
    } catch (err: unknown) {
      console.warn("Wallet balance fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, tokenMintAddress]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 3000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    solBalance,
    batonBalance,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}
