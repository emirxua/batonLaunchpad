"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { Coin } from "@/types/coin";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
import { prepareRealBurnTransaction } from "@/lib/burn";
import { getBurnTierInfo } from "@/lib/burn-levels";
import confetti from "canvas-confetti";
import dynamic from "next/dynamic";
import {
  Flame,
  X,
  Wallet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

// Dynamic wallet button for unconnected state
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface DynamicTokenMetadata {
  name: string;
  symbol: string;
  imageUrl?: string;
  priceUsd?: number;
}

// In-memory cache for resolved metadata across modals
const tokenMetadataCache = new Map<string, DynamicTokenMetadata>();

interface BurnModalProps {
  coin: Coin | null;
  isOpen: boolean;
  initialAmount?: number;
  onClose: () => void;
  onSuccess?: (coinId: string, burnedAmount: number) => void;
}

type BurnState =
  | "idle"
  | "awaiting_approval"
  | "confirming"
  | "success"
  | "error";

export const BurnModal: React.FC<BurnModalProps> = ({
  coin,
  isOpen,
  initialAmount = 1000,
  onClose,
  onSuccess,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { batonBalance, isLoading: balanceLoading, refetch } =
    useUserBatonBalance();

  const [amount, setAmount] = useState<number>(initialAmount);
  const [burnState, setBurnState] = useState<BurnState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCA, setCopiedCA] = useState<boolean>(false);

  // Dynamic verified on-chain burn state for this specific coin
  const [verifiedCoinBurn, setVerifiedCoinBurn] = useState<number>(
    coin?.totalBurnedBaton || 0
  );

  // Dynamic token metadata resolution
  const [dynamicMeta, setDynamicMeta] = useState<DynamicTokenMetadata | null>(
    null
  );
  const [metaLoading, setMetaLoading] = useState<boolean>(false);

  const mintAddress = coin?.mintAddress || "";
  const shortMint = useMemo(() => {
    if (!mintAddress) return "";
    return `${mintAddress.slice(0, 4)}…${mintAddress.slice(-4)}`;
  }, [mintAddress]);

  // Fetch verified burns from API for this coin
  const fetchLiveCoinBurns = useCallback(async (coinId: string, mint: string) => {
    try {
      const res = await fetch("/api/burns");
      if (res.ok) {
        const data = await res.json();
        const records = Array.isArray(data.recentBurns) ? data.recentBurns : [];
        const matched = records
          .filter(
            (b: { coinId?: string; userAddress?: string; amount?: number }) =>
              b.coinId === coinId || b.coinId === mint
          )
          .reduce(
            (sum: number, b: { amount?: number }) => sum + (Number(b.amount) || 0),
            0
          );
        setVerifiedCoinBurn(matched);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch real on-chain / DexScreener / Pump metadata dynamically if coin has generic placeholder
  const resolveMetadata = useCallback(async (mint: string) => {
    if (!mint) return;
    if (tokenMetadataCache.has(mint)) {
      setDynamicMeta(tokenMetadataCache.get(mint)!);
      return;
    }

    setMetaLoading(true);
    try {
      // 1. Try DexScreener API for token pair metadata
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (res.ok) {
        const data = await res.json();
        const pair = data.pairs?.[0];
        if (pair?.baseToken?.symbol) {
          const meta: DynamicTokenMetadata = {
            name: pair.baseToken.name || pair.baseToken.symbol,
            symbol: pair.baseToken.symbol,
            imageUrl: pair.info?.imageUrl,
            priceUsd: Number(pair.priceUsd) || undefined,
          };
          tokenMetadataCache.set(mint, meta);
          setDynamicMeta(meta);
          return;
        }
      }

      // 2. Fallback to Pump.fun API if DexScreener has no pairs yet
      const pumpRes = await fetch(`https://frontend-api-v3.pump.fun/coins/${mint}`);
      if (pumpRes.ok) {
        const pumpData = await pumpRes.json();
        if (pumpData?.symbol) {
          const meta: DynamicTokenMetadata = {
            name: pumpData.name || pumpData.symbol,
            symbol: pumpData.symbol,
            imageUrl: pumpData.image_uri,
          };
          tokenMetadataCache.set(mint, meta);
          setDynamicMeta(meta);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not resolve dynamic token metadata:", e);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  // Prevent background scroll and initialize modal state
  useEffect(() => {
    if (isOpen && coin) {
      document.body.style.overflow = "hidden";
      setAmount(initialAmount > 0 ? initialAmount : 1000);
      setTxSignature(null);
      setErrorMessage(null);
      setBurnState("idle");
      setCopiedCA(false);
      setVerifiedCoinBurn(coin.totalBurnedBaton || 0);

      // Fetch dynamic verified burns from backend store
      if (coin.id || coin.mintAddress) {
        fetchLiveCoinBurns(coin.id, coin.mintAddress);
      }

      // Check if coin already has verified metadata or needs resolution
      const hasVerifiedTicker =
        coin.ticker &&
        coin.ticker !== "?" &&
        coin.ticker !== "BATON" &&
        coin.name !== coin.mintAddress.slice(0, 8);

      if (hasVerifiedTicker) {
        setDynamicMeta({
          name: coin.name,
          symbol: coin.ticker,
          imageUrl: coin.imageUrl,
        });
      } else if (coin.mintAddress) {
        resolveMetadata(coin.mintAddress);
      }
    } else {
      document.body.style.overflow = "";
      setDynamicMeta(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, coin, initialAmount, resolveMetadata, fetchLiveCoinBurns]);

  // ── DYNAMIC TIER CALCULATION ─────────────────────────────────────────────────
  // Tier thresholds (exact specification):
  // Bronze: 10,000 $BATON
  // Silver: 50,000 $BATON
  // Gold: 250,000 $BATON
  // Diamond: 1,000,000+ $BATON

  const currentBurned = verifiedCoinBurn; // 100% dynamic, 0 if 0

  const {
    nextTierName,
    nextTierThreshold,
    currentTierBase,
    progressPercent,
    remainingToNext,
    simulatedTotal,
    simulatedProgressPercent,
    willUpgradeTier,
    simulatedTierLabel,
  } = useMemo(() => {
    let nextTier = "Bronze";
    let threshold = 10_000;
    let base = 0;

    if (currentBurned >= 1_000_000) {
      nextTier = "Diamond (Max Tier)";
      threshold = 1_000_000;
      base = 1_000_000;
    } else if (currentBurned >= 250_000) {
      nextTier = "Diamond";
      threshold = 1_000_000;
      base = 250_000;
    } else if (currentBurned >= 50_000) {
      nextTier = "Gold";
      threshold = 250_000;
      base = 50_000;
    } else if (currentBurned >= 10_000) {
      nextTier = "Silver";
      threshold = 50_000;
      base = 10_000;
    } else {
      nextTier = "Bronze";
      threshold = 10_000;
      base = 0;
    }

    const remaining = Math.max(0, threshold - currentBurned);
    const progress =
      currentBurned >= 1_000_000
        ? 100
        : Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((currentBurned - base) / (threshold - base)) * 100
              )
            )
          );

    // Live simulation with user entered burn amount
    const simTotal = currentBurned + (amount > 0 ? amount : 0);
    const simProgress =
      simTotal >= 1_000_000
        ? 100
        : Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((simTotal - base) / (threshold - base)) * 100
              )
            )
          );

    const currentTierInfo = getBurnTierInfo(currentBurned);
    const simTierInfo = getBurnTierInfo(simTotal);
    const upgrade = simTierInfo.level !== currentTierInfo.level && simTotal > currentBurned;

    return {
      nextTierName: nextTier,
      nextTierThreshold: threshold,
      currentTierBase: base,
      progressPercent: progress,
      remainingToNext: remaining,
      simulatedTotal: simTotal,
      simulatedProgressPercent: simProgress,
      willUpgradeTier: upgrade,
      simulatedTierLabel: simTierInfo.label,
    };
  }, [currentBurned, amount]);

  if (!isOpen || !coin) return null;

  // Determine display symbol and name
  const displaySymbol =
    dynamicMeta?.symbol ||
    (coin.ticker && coin.ticker !== "?" ? coin.ticker : null);

  const displayName = dynamicMeta?.name || coin.name;
  const displayImage = dynamicMeta?.imageUrl || coin.imageUrl;

  // Title: "BURN $BATON TO BOOST $SYMBOL" or fallback "BURN $BATON TO BOOST ${shortMint}"
  const modalTitle = displaySymbol
    ? `BURN $BATON TO BOOST $${displaySymbol.toUpperCase()}`
    : `BURN $BATON TO BOOST ${shortMint}`;

  // Subtitle: "Burn $BATON on-chain to boost $SYMBOL visibility and climb rank."
  const modalSubtitle = displaySymbol
    ? `Burn $BATON on-chain to boost $${displaySymbol.toUpperCase()} visibility and climb rank.`
    : `Burn $BATON on-chain to boost ${shortMint} visibility and climb rank.`;

  const quickAmounts = [1000, 5000, 25000];

  const handleMaxClick = () => {
    if (batonBalance && batonBalance > 0) {
      setAmount(Math.floor(batonBalance));
    }
  };

  const handleCopyCA = () => {
    if (!coin.mintAddress) return;
    navigator.clipboard.writeText(coin.mintAddress);
    setCopiedCA(true);
    setTimeout(() => setCopiedCA(false), 2000);
  };

  const handleBurnSubmit = async () => {
    if (!connected || !publicKey) {
      setErrorMessage("Please connect your Solana wallet first.");
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMessage("Please enter a valid $BATON burn amount.");
      return;
    }

    if (batonBalance !== null && amount > batonBalance) {
      setErrorMessage(
        `Insufficient $BATON balance. You have ${batonBalance.toLocaleString()} $BATON.`
      );
      return;
    }

    setErrorMessage(null);
    setTxSignature(null);

    try {
      // 1. Build real on-chain SPL Token Burn Transaction with BOOST:<targetMint> Memo
      setBurnState("awaiting_approval");
      const { transaction } = await prepareRealBurnTransaction({
        connection,
        userPublicKey: publicKey,
        burnAmount: amount,
        targetCoinTicker: displaySymbol || coin.ticker || "BATON",
        targetMint: coin.mintAddress,
      });

      // 2. Request signature from connected Solana wallet
      const signature = await sendTransaction(transaction, connection);
      console.log("Real Burn Transaction Sent! Signature:", signature);

      // 3. Confirm transaction on-chain
      setBurnState("confirming");
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed on-chain: ${JSON.stringify(
            confirmation.value.err
          )}`
        );
      }

      // 4. Record genuine on-chain TX in backend
      try {
        await fetch("/api/burns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: signature,
            coinId: coin.id,
            amount: amount,
            userAddress: publicKey.toBase58(),
          }),
        });
      } catch (apiErr) {
        console.warn("Failed to record burn signature to API:", apiErr);
      }

      // 5. Success state & Confetti
      setTxSignature(signature);
      setBurnState("success");
      setVerifiedCoinBurn((prev) => prev + amount);
      onSuccess?.(coin.id, amount);
      refetch();

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d4ff3f", "#ff3d7a", "#ffd700", "#70d6ff"],
        });
      } catch (cErr) {
        console.log("Confetti trigger:", cErr);
      }
    } catch (err: unknown) {
      console.error("Burn execution failed:", err);
      setBurnState("error");
      let message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during the burn transaction.";

      if (
        message.includes("403") ||
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("rate limit")
      ) {
        message =
          "Solana RPC ağ yoğunluğu yaşanıyor veya cüzdanda yeterli $BATON bulunamadı. Lütfen tekrar deneyin.";
      }
      setErrorMessage(message);
    }
  };

  const isProcessing =
    burnState === "awaiting_approval" || burnState === "confirming";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#111318]/95 border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/80 relative my-auto transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)] shrink-0">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-archivo text-base sm:text-lg text-white font-black tracking-wide uppercase leading-tight truncate">
                {modalTitle}
              </h3>
              <p className="font-space text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                {modalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Token Künyesi / Info Card */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/10 space-y-2 font-mono">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {displayImage ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                  <Image
                    src={displayImage}
                    alt={displayName || "token"}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0 uppercase">
                  {(displaySymbol || displayName || "T").slice(0, 2)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs truncate">
                    {displaySymbol ? `$${displaySymbol.toUpperCase()}` : shortMint}
                  </span>
                  {displayName && displayName !== displaySymbol && (
                    <span className="text-[11px] text-zinc-400 truncate">
                      ({displayName})
                    </span>
                  )}
                </div>
                {metaLoading && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Fetching metadata…
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`https://pump.fun/coin/${coin.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-lime-400 hover:text-lime-300 text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                title="Pump.fun"
              >
                <span>Pump</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={`https://dexscreener.com/solana/${coin.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                title="DexScreener"
              >
                <span>DEX</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* CA row with copy button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
              CA:
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-zinc-300 truncate text-[10px]">
                {coin.mintAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyCA}
                className="p-1 hover:text-orange-400 transition-colors text-zinc-500 shrink-0"
                title="Copy Contract Address"
              >
                {copiedCA ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success State Screen */}
        {burnState === "success" && txSignature ? (
          <div className="py-6 space-y-6 text-center font-mono animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-lime-400/15 border border-lime-400/40 text-lime-400 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="font-archivo text-2xl text-white uppercase font-black">
                BURN CONFIRMED ON SOLANA!
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-space">
                <span className="text-lime-400 font-bold">
                  {amount.toLocaleString()} $BATON
                </span>{" "}
                permanently burned on-chain to boost{" "}
                <strong className="text-white">
                  {displaySymbol ? `$${displaySymbol.toUpperCase()}` : shortMint}
                </strong>
                .
              </p>
            </div>

            {/* Solscan Link Box */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-zinc-900/60 text-xs flex items-center justify-between gap-3">
              <span className="text-zinc-400 truncate font-mono text-[11px]">
                {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
              </span>
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lime-400 hover:underline inline-flex items-center gap-1 font-bold shrink-0 text-xs"
              >
                <span>View on Solscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-lime-400 text-black font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:bg-lime-300 transition-all cursor-pointer"
            >
              Done &amp; Return
            </button>
          </div>
        ) : (
          <>
            {/* 1. Dynamic Tier Progress Bar with Live Simulation Preview */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-zinc-900/50 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  <span>Next Tier:</span>
                  <span className="text-white font-bold uppercase">
                    {nextTierName} ({nextTierThreshold.toLocaleString()} $BATON)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400 font-bold">
                    {progressPercent}%
                  </span>
                  {amount > 0 && simulatedProgressPercent > progressPercent && (
                    <span className="text-lime-400 text-[11px] font-bold">
                      → {simulatedProgressPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Track: base fill + simulated boost preview */}
              <div className="w-full h-3 rounded-full bg-zinc-950 border border-white/10 overflow-hidden p-0.5 relative flex">
                {/* Existing Burned Base */}
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.5)] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Simulated Boost Delta */}
                {amount > 0 && simulatedProgressPercent > progressPercent && (
                  <div
                    className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.8)] transition-all duration-300 rounded-r-full"
                    style={{
                      width: `${simulatedProgressPercent - progressPercent}%`,
                    }}
                  />
                )}
              </div>

              {/* Dynamic Stats Row */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                <span>
                  Current:{" "}
                  <strong className="text-zinc-200">
                    {currentBurned.toLocaleString()} $BATON
                  </strong>
                </span>

                {remainingToNext > 0 ? (
                  <span>
                    Remaining:{" "}
                    <strong className="text-orange-400 font-semibold">
                      {remainingToNext.toLocaleString()} $BATON
                    </strong>
                  </span>
                ) : (
                  <span className="text-lime-400 font-bold">
                    ★ Diamond Rank Reached
                  </span>
                )}
              </div>

              {/* Tier Upgrade Live Banner if simulated burn achieves next rank */}
              {willUpgradeTier && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime-400/10 border border-lime-400/30 text-lime-400 text-[10px] font-bold animate-pulse">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>
                    This burn (+{amount.toLocaleString()} $BATON) unlocks the{" "}
                    {simulatedTierLabel} Tier!
                  </span>
                </div>
              )}
            </div>

            {/* 2. Amount Input & Wallet Balance */}
            <div className="space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-400 font-medium">
                  Burn Amount ($BATON):
                </label>
                {connected && (
                  <div className="text-zinc-400 flex items-center gap-1 text-[11px]">
                    <Wallet className="w-3 h-3 text-orange-400" />
                    <span>Balance:</span>
                    <span className="text-white font-bold">
                      {balanceLoading
                        ? "..."
                        : `${(batonBalance ?? 0).toLocaleString()} $BATON`}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="Enter amount..."
                  disabled={isProcessing}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-3 text-base font-bold text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-3.5 text-xs font-black text-orange-400 uppercase tracking-wider pointer-events-none">
                  $BATON
                </span>
              </div>

              {/* Quick Increment Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount((prev) => prev + q)}
                    disabled={isProcessing}
                    className="py-1.5 rounded-lg border border-white/10 bg-zinc-900/60 hover:border-white/25 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +{q.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleMaxClick}
                  disabled={isProcessing || !batonBalance}
                  className="py-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-400 font-bold text-xs hover:bg-orange-500 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1 font-mono">
              {!connected ? (
                <div className="w-full flex flex-col items-center gap-2">
                  <WalletMultiButton />
                  <p className="text-[11px] text-zinc-500">
                    Connect your Solana wallet to execute on-chain burn.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBurnSubmit}
                    disabled={isProcessing || amount <= 0}
                    className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {burnState === "awaiting_approval" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Awaiting Wallet...</span>
                      </>
                    ) : burnState === "confirming" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming On-Chain...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4 fill-current" />
                        <span>Confirm Burn 🔥</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
