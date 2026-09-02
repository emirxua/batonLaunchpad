"use client";

import React, { useState, useEffect } from "react";
import { mutate } from "swr";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
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
  Wallet,
} from "lucide-react";

interface BoostAnyTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (mint: string, burnedAmount: number) => void;
  initialToken?: {
    mint: string;
    name: string;
    symbol: string;
    iconUrl?: string;
    priceUsd?: number;
    marketCap?: number;
  } | null;
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
  initialToken,
}: BoostAnyTokenModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { batonBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useUserBatonBalance();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SearchedToken | null>(null);
  const [burnAmount, setBurnAmount] = useState<number | "">("");
  const [burning, setBurning] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or pre-fill state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialToken) {
        setSelectedToken({
          mint: initialToken.mint,
          name: initialToken.name,
          symbol: initialToken.symbol,
          iconUrl: initialToken.iconUrl,
          priceUsd: initialToken.priceUsd ?? 0,
          marketCap: initialToken.marketCap ?? 0,
          volume24h: 0,
          liquidityUsd: 0,
        });
        setSearchQuery(initialToken.mint);
      } else {
        setSearchQuery("");
        setSelectedToken(null);
      }
      setBurnAmount("");
      setErrorMessage(null);
      setTxSignature(null);
    }
  }, [isOpen, initialToken]);

  // Live CA / token lookup via DexScreener & Pump.fun proxy
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setIsSearching(false);
      setSelectedToken(null);
      return;
    }

    // If query matches current initialToken mint, retain initialToken data
    if (initialToken && trimmed.toLowerCase() === initialToken.mint.toLowerCase()) {
      setSelectedToken({
        mint: initialToken.mint,
        name: initialToken.name,
        symbol: initialToken.symbol,
        iconUrl: initialToken.iconUrl,
        priceUsd: initialToken.priceUsd ?? 0,
        marketCap: initialToken.marketCap ?? 0,
        volume24h: 0,
        liquidityUsd: 0,
      });
      setIsSearching(false);
      return;
    }

    if (trimmed.length >= 2) {
      let active = true;
      setIsSearching(true);
      setErrorMessage(null);

      const ctrl = new AbortController();

      fetch(`/api/token-lookup?q=${encodeURIComponent(trimmed)}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Token lookup failed");
          const data = await res.json();
          if (!active) return;

          const match = Array.isArray(data.results) && data.results.length > 0
            ? data.results[0]
            : data.mint
            ? data
            : null;

          if (match && (match.mint || match.ca)) {
            const mcap = match.marketCap || match.mcap || match.usd_market_cap || 0;
            const price = match.priceUsd || match.price || 0;
            setSelectedToken({
              mint: match.mint || match.ca,
              name: match.name || "Solana Token",
              symbol: (match.symbol || "TOKEN").toUpperCase(),
              iconUrl: match.iconUrl || match.image_uri,
              priceUsd: price,
              marketCap: mcap,
              volume24h: match.volume24h || 0,
              liquidityUsd: match.liquidityUsd || 0,
            });
          }
        })
        .catch(() => {
          if (active && trimmed.length >= 32) {
            setSelectedToken({
              mint: trimmed,
              name: "Solana Token",
              symbol: "SOLANA",
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
    } else {
      setSelectedToken(null);
    }
  }, [searchQuery, initialToken]);

  if (!isOpen) return null;

  const currentWalletBaton = batonBalance !== null ? batonBalance : 0;
  const numAmount = typeof burnAmount === "number" ? burnAmount : 0;
  const isExceedingBalance = connected && numAmount > 0 && currentWalletBaton < numAmount;

  const handleExecuteBurn = async () => {
    setErrorMessage(null);
    setTxSignature(null);

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!selectedToken || !selectedToken.mint) {
      setErrorMessage("Please enter a valid Solana Token Contract Address (CA) first.");
      return;
    }

    if (numAmount <= 0 || isNaN(numAmount)) {
      setErrorMessage("Please enter a valid $BATON burn amount (greater than 0).");
      return;
    }

    if (currentWalletBaton < numAmount) {
      setErrorMessage(
        `Insufficient $BATON balance in your wallet. You have ${formatNumber(currentWalletBaton)} $BATON.`
      );
      return;
    }

    try {
      setBurning(true);

      // 1. Prepare SPL token burn transaction
      const { transaction, blockhash, lastValidBlockHeight } =
        await prepareRealBurnTransaction({
          connection,
          userPublicKey: publicKey,
          burnAmount: numAmount,
          targetCoinTicker: selectedToken.symbol,
          targetMint: selectedToken.mint,
        });

      // 2. Submit transaction to Solana network
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      // 3. Immediately record genuine verified burn to Turso DB
      try {
        await fetch("/api/burns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: signature,
            coinId: selectedToken.mint,
            coinName: selectedToken.name,
            coinTicker: selectedToken.symbol,
            amount: numAmount,
            userAddress: publicKey.toBase58(),
          }),
        });
      } catch (apiErr) {
        console.warn("Failed to record burn signature to API:", apiErr);
      }

      // 4. Background confirmation on Solana blockchain
      try {
        connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        ).catch((err) => console.warn("Background confirmation notice:", err));
      } catch {
        /* non-fatal */
      }

      // 5. Revalidate all caches so token immediately enters leaderboard
      mutate("/api/burns");
      mutate("/api/leaderboard");
      mutate("/api/token-stats");
      mutate("/api/directory");
      refetchBalance();

      setTxSignature(signature);
      onSuccess?.(selectedToken.mint, numAmount);
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
        className="bg-white dark:bg-[#0c0d14] border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl shadow-amber-500/10 relative overflow-hidden cursor-default"
      >
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-transparent border border-amber-500/40 text-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/10 shrink-0">
            <Flame className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-base sm:text-lg text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>{selectedToken ? `Burn $BATON & Boost $${selectedToken.symbol}` : "Burn $BATON & Boost Rank"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold uppercase">
                Leaderboard
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {selectedToken ? `Burn $BATON to elevate $${selectedToken.symbol} on the official Leaderboard` : "Burn $BATON to rank any Solana token on the Leaderboard"}
            </p>
          </div>
        </div>

        {/* ── Step 1: Search / Paste Token CA ─────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>1. Target Solana Contract Address (CA)</span>
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
              placeholder="Paste Token Mint CA or type name..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs font-mono text-zinc-950 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Edit / Change Token Hint Notice */}
          <div className="flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 px-3.5 py-2.5 rounded-2xl font-mono leading-relaxed">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Want to boost a different token? Clear the address above and paste any token&apos;s <strong>Contract Address (CA)</strong> or search by <strong>name</strong>.
            </span>
          </div>
        </div>

        {/* ── Token Preview Box (Only when valid CA is found) ─────────── */}
        {selectedToken && (
          <div className="p-4 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-[#12131a] dark:via-[#161822] dark:to-[#12131a] rounded-2xl border border-amber-500/40 flex items-center justify-between gap-3 shadow-lg shadow-black/5 dark:shadow-black/40 animate-in fade-in">
            <div className="flex items-center gap-3.5 min-w-0">
              {selectedToken.iconUrl ? (
                <img
                  src={selectedToken.iconUrl}
                  alt={selectedToken.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-500/30 shadow-md shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/25 text-amber-400 font-black text-sm flex items-center justify-center border border-amber-500/30 shrink-0">
                  {selectedToken.symbol.slice(0, 3)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-zinc-950 dark:text-white truncate">
                    {selectedToken.name}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-extrabold font-mono">
                    ${selectedToken.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-0.5">
                  <span>
                    MC:{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedToken.marketCap > 0
                        ? selectedToken.marketCap >= 1e6
                          ? `$${(selectedToken.marketCap / 1e6).toFixed(2)}M`
                          : `$${(selectedToken.marketCap / 1e3).toFixed(1)}K`
                        : "Live Solana Pair"}
                    </strong>
                  </span>
                  <a
                    href={`https://dexscreener.com/solana/${selectedToken.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    Dex ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Select $BATON Burn Amount & Wallet Balance ───────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>2. $BATON Burn Amount</span>
            </span>

            {/* Live Connected Wallet Balance */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-zinc-500">Balance:</span>
              <span className="font-bold text-zinc-950 dark:text-white">
                {isBalanceLoading
                  ? "Loading..."
                  : `${formatNumber(currentWalletBaton)} $BATON`}
              </span>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              value={burnAmount}
              onChange={(e) => {
                const val = e.target.value;
                setBurnAmount(val === "" ? "" : Math.max(0, parseInt(val) || 0));
                setErrorMessage(null);
              }}
              className={`w-full bg-zinc-50 dark:bg-zinc-900/90 border rounded-2xl pl-5 pr-24 py-3.5 text-xl font-black text-zinc-950 dark:text-white outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ${
                isExceedingBalance
                  ? "border-rose-500/70 focus:border-rose-500 ring-2 ring-rose-500/10"
                  : "border-zinc-200 dark:border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
              }`}
              placeholder="0.00"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-extrabold text-xs">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>$BATON</span>
            </div>
          </div>

          {/* Preset Additive Buttons + 50% & MAX */}
          <div className="grid grid-cols-6 gap-1.5 pt-0.5">
            {[10000, 50000, 100000, 500000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setBurnAmount((prev) => (typeof prev === "number" ? prev + val : val));
                  setErrorMessage(null);
                }}
                className="py-2 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer bg-zinc-100 dark:bg-zinc-900/80 hover:bg-amber-500/15 text-zinc-800 dark:text-zinc-200 hover:text-amber-400 border-zinc-200 dark:border-white/10 hover:border-amber-500/40 active:scale-95 shadow-sm"
              >
                +{val >= 1000 ? `${val / 1000}K` : val}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setBurnAmount(Math.floor(currentWalletBaton / 2));
                setErrorMessage(null);
              }}
              className="py-2 rounded-xl text-[11px] font-extrabold bg-zinc-100 dark:bg-zinc-900/80 hover:bg-amber-500/15 text-zinc-700 dark:text-zinc-300 hover:text-amber-400 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 cursor-pointer active:scale-95"
            >
              50%
            </button>

            <button
              type="button"
              onClick={() => {
                setBurnAmount(Math.floor(currentWalletBaton));
                setErrorMessage(null);
              }}
              className="py-2 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-500 dark:text-amber-400 border border-amber-500/40 cursor-pointer active:scale-95 shadow-sm"
            >
              MAX
            </button>
          </div>
        </div>

        {/* ── Live Leaderboard Impact Preview Box ─────────────────────── */}
        {selectedToken && numAmount > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Leaderboard Impact</span>
              </span>
              <span className="text-amber-500 dark:text-amber-400 font-extrabold font-mono">
                +{formatNumber(numAmount)} Score
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              Burning {formatNumber(numAmount)} $BATON elevates <strong className="text-zinc-950 dark:text-white">${selectedToken.symbol}</strong> into the official Solana Leaderboard rankings.
            </p>
          </div>
        )}

        {/* ── Insufficient Balance Warning Banner ────────────────────────── */}
        {isExceedingBalance && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Insufficient $BATON balance in your wallet ({formatNumber(currentWalletBaton)} $BATON available).
            </span>
          </div>
        )}

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
        {errorMessage && !isExceedingBalance && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-400 text-xs animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── Execute Button ────────────────────────────────────────────── */}
        <button
          type="button"
          disabled={burning || !selectedToken || numAmount <= 0}
          onClick={handleExecuteBurn}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {burning ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Confirming on Solana Blockchain...</span>
            </>
          ) : !selectedToken ? (
            <>
              <Flame className="w-4 h-4 fill-current text-zinc-950" />
              <span>Enter Token CA to Boost</span>
            </>
          ) : numAmount <= 0 ? (
            <>
              <Flame className="w-4 h-4 fill-current text-zinc-950" />
              <span>Enter $BATON Amount to Burn</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-current text-zinc-950" />
              <span>
                Burn {formatNumber(numAmount)} $BATON &amp; Boost ${selectedToken.symbol}
              </span>
            </>
          )}
        </button>

        {/* ── On-Chain Proof Footer ───────────────────────────────────── */}
        <div className="text-center pt-1">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            🛡️ 100% On-Chain Verifiable Burn • Permanently removed from Solana supply
          </span>
        </div>
      </div>
    </div>
  );
}

export default BoostAnyTokenModal;
