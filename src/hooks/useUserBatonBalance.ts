"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { FALLBACK_BATON_MINT } from "@/lib/solana-burn";

// Optional default mint address for $BATON (can be overridden via env)
const BATON_TOKEN_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS || FALLBACK_BATON_MINT;

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

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch SOL Balance
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;
      setSolBalance(sol);

      // 2. Fetch $BATON SPL Token Accounts by Owner
      try {
        const tokenMintKey = new PublicKey(tokenMintAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: tokenMintKey }
        );

        if (tokenAccounts.value && tokenAccounts.value.length > 0) {
          const totalTokenAmount = tokenAccounts.value.reduce((acc, account) => {
            const amount =
              account.account.data.parsed.info.tokenAmount.uiAmount || 0;
            return acc + amount;
          }, 0);
          setBatonBalance(totalTokenAmount);
        } else {
          // If no token account exists for this mint yet
          setBatonBalance(0);
        }
      } catch (tokenErr) {
        // Fallback if invalid mint address or dev environment
        console.warn("Could not fetch $BATON token balance:", tokenErr);
        setBatonBalance(0);
      }
    } catch (err: unknown) {
      console.error("Error fetching wallet balance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, tokenMintAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    solBalance,
    batonBalance,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}
