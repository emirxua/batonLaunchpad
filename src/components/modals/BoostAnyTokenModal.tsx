"use client";

import React, { useState, useEffect } from "react";
import { mutate } from "swr";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { prepareRealBurnTransaction } from "@/lib/burn";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Flame,
  X,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface BoostAnyTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (mint: string, burnedAmount: number) => void;
}

interface SearchedToken {
  mint: string;
  name: string;
  symbol: string;
  iconUrl?: string;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  liquidityUsd: number;
}

export function BoostAnyTokenModal({
  isOpen,
  onClose,
  onSuccess,
}: BoostAnyTokenModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SearchedToken | null>(null);
  const [burnAmount, setBurnAmount] = useState<number>(50000);
  const [burning, setBurning] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live CA lookup via DexScreener proxy
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setIsSearching(false);
      return;
    }

    if (trimmed.length >= 32 && trimmed.length <= 44 && !/\s/.test(trimmed)) {
      let active = true;
      setIsSearching(true);
      setErrorMessage(null);

      const ctrl = new AbortController();

      fetch(`/api/token-lookup?mint=${encodeURIComponent(trimmed)}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Token lookup failed");
          const data = await res.json();
          if (!active) return;

          if (data && data.mint) {
            setSelectedToken({
              mint: data.mint,
              name: data.name || "Solana Token",
              symbol: (data.symbol || "TOKEN").toUpperCase(),
              iconUrl: data.iconUrl || undefined,
              priceUsd: data.priceUsd || 0,
              marketCap: data.marketCap || 0,
              volume24h: data.volume24h || 0,
              liquidityUsd: data.liquidityUsd || 0,
            });
          }
        })
        .catch(() => {
          if (active) {
            setSelectedToken({
              mint: trimmed,
              name: "Solana Token",
              symbol: `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`,
              priceUsd: 0,
              marketCap: 0,
              volume24h: 0,
              liquidityUsd: 0,
            });
          }
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });

      return () => {
        active = false;
        ctrl.abort();
      };
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleExecuteBurn = async () => {
    setErrorMessage(null);
    setTxSignature(null);

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!selectedToken || !selectedToken.mint) {
      setErrorMessage("Please enter and select a valid Solana Token CA to boost.");
      return;
    }

    if (burnAmount <= 0 || isNaN(burnAmount)) {
      setErrorMessage("Please enter a valid $BATON burn amount.");
      return;
    }

    try {
      setBurning(true);

      // 1. Prepare SPL token burn transaction
      const { transaction } = await prepareRealBurnTransaction({
        connection,
        userPublicKey: publicKey,
        burnAmount,
        targetCoinTicker: selectedToken.symbol,
        targetMint: selectedToken.mint,
      });

      // 2. Submit transaction to Solana network
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      // 3. Confirm on Solana blockchain
      try {
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "confirmed"
        );
      } catch (confirmErr) {
        console.warn("Confirmation check warning:", confirmErr);
      }

      // 4. Record genuine verified burn to API
      try {
        await fetch("/api/burns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: signature,
            coinId: selectedToken.mint,
            coinName: selectedToken.name,
            coinTicker: selectedToken.symbol,
            amount: burnAmount,
            userAddress: publicKey.toBase58(),
          }),
        });
      } catch (apiErr) {
        console.warn("Failed to record burn signature to API:", apiErr);
      }

      // 5. Revalidate all caches so token immediately enters leaderboard
      mutate("/api/burns");
      mutate("/api/leaderboard");
      mutate("/api/token-stats");
      mutate("/api/directory");

      setTxSignature(signature);
      onSuccess?.(selectedToken.mint, burnAmount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User rejected") || msg.includes("rejected")) {
        setErrorMessage("Transaction was cancelled in your wallet.");
      } else if (msg.includes("insufficient") || msg.includes("0x1") || msg.includes("Insufficient")) {
        setErrorMessage("Insufficient $BATON balance in your wallet to complete the burn.");
      } else {
        setErrorMessage(msg || "Failed to execute burn transaction.");
      }
    } finally {
      setBurning(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden cursor-default"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white uppercase tracking-wider">
                Boost Any Token
              </h3>
              <span className="text-[10px] text-zinc-500 block">
                Burn $BATON to rank any Solana token on the Leaderboard
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step 1: Search / Paste Token CA ─────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>1. Enter Solana Contract Address (CA)</span>
            {isSearching && (
              <span className="text-[10px] text-amber-500 animate-pulse font-bold">
                Fetching DexScreener...
              </span>
            )}
          </label>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Paste Token Mint CA (e.g. 2vdc4owf...pump)"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs font-mono text-zinc-950 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* ── Token Preview Box ────────────────────────────────────────── */}
        {selectedToken && (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/70 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              {selectedToken.iconUrl ? (
                <img
                  src={selectedToken.iconUrl}
                  alt={selectedToken.name}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-500/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center border border-amber-500/30">
                  {selectedToken.symbol.slice(0, 3)}
                </div>
              )}
              <div>
                <h4 className="font-black text-sm text-zinc-950 dark:text-white uppercase">
                  {selectedToken.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-amber-500 dark:text-amber-400">
                    ${selectedToken.symbol}
                  </span>
                  <span className="text-zinc-500">
                    MC: {formatCurrency(selectedToken.marketCap)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                ✓ Verified CA
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Select $BATON Burn Amount ────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>2. $BATON Burn Amount</span>
            <span className="text-[10px] text-zinc-500 font-normal">
              Permanently destroyed to boost rank
            </span>
          </label>

          <div className="relative">
            <input
              type="number"
              value={burnAmount}
              onChange={(e) => setBurnAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-3 text-lg font-black text-zinc-950 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="50000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-amber-500">
              $BATON
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {[10000, 50000, 100000, 500000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setBurnAmount(val)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  burnAmount === val
                    ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-black"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:border-amber-500/30"
                }`}
              >
                +{val >= 1000 ? `${val / 1000}K` : val}
              </button>
            ))}
          </div>
        </div>

        {/* ── Success Banner ────────────────────────────────────────────── */}
        {txSignature && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Token Boosted! Standings Leaderboard Updated!</span>
            </div>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 underline break-all"
            >
              <span>Verify on Solscan: {txSignature.slice(0, 16)}...</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-400 text-xs animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── Execute Button ────────────────────────────────────────────── */}
        <button
          type="button"
          disabled={burning || !selectedToken || burnAmount <= 0}
          onClick={handleExecuteBurn}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {burning ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Confirming on Solana Blockchain...</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-current text-zinc-950" />
              <span>
                {selectedToken
                  ? `Burn ${burnAmount.toLocaleString()} $BATON & Boost $${selectedToken.symbol}`
                  : "Enter Token CA to Boost"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default BoostAnyTokenModal;
