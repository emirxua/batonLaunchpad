"use client";

import React, { useState, useEffect } from "react";
import { Coin } from "@/types/coin";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
import { prepareRealBurnTransaction } from "@/lib/burn";
import { getBurnLevel } from "@/lib/burn-levels";
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
} from "lucide-react";

// Dynamic wallet button for unconnected state
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface BurnModalProps {
  coin: Coin | null;
  isOpen: boolean;
  initialAmount?: number;
  onClose: () => void;
  onSuccess?: (coinId: string, burnedAmount: number) => void;
}

type BurnState = "idle" | "awaiting_approval" | "confirming" | "success" | "error";

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

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setAmount(initialAmount > 0 ? initialAmount : 1000);
      setTxSignature(null);
      setErrorMessage(null);
      setBurnState("idle");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, coin]);

  if (!isOpen || !coin) return null;

  // Calculate Next Tier Progress
  const currentBurned = coin.totalBurnedBaton || 0;
  const currentTier = getBurnLevel(currentBurned);

  let nextTierName = "Bronze";
  let nextTierTarget = 10000;
  let currentTierBase = 0;

  if (currentTier === "diamond") {
    nextTierName = "Max Tier (Diamond)";
    nextTierTarget = 1000000;
    currentTierBase = 1000000;
  } else if (currentTier === "gold") {
    nextTierName = "Diamond";
    nextTierTarget = 1000000;
    currentTierBase = 200000;
  } else if (currentTier === "silver") {
    nextTierName = "Gold";
    nextTierTarget = 200000;
    currentTierBase = 50000;
  } else if (currentTier === "bronze") {
    nextTierName = "Silver";
    nextTierTarget = 50000;
    currentTierBase = 10000;
  }

  const remainingToNext = Math.max(0, nextTierTarget - currentBurned);
  const progressPercent =
    currentTier === "diamond"
      ? 100
      : Math.min(
          100,
          Math.max(
            5,
            Math.round(
              ((currentBurned - currentTierBase) /
                (nextTierTarget - currentTierBase)) *
                100
            )
          )
        );

  const quickAmounts = [1000, 5000, 25000];

  const handleMaxClick = () => {
    if (batonBalance && batonBalance > 0) {
      setAmount(Math.floor(batonBalance));
    }
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
      // 1. Build real on-chain SPL Token Burn Transaction
      setBurnState("awaiting_approval");
      const { transaction } = await prepareRealBurnTransaction({
        connection,
        userPublicKey: publicKey,
        burnAmount: amount,
        targetCoinTicker: coin.ticker,
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
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#111318]/95 border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl shadow-black/80 relative my-auto transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/30 flex items-center justify-center text-magenta shadow-[0_0_15px_rgba(255,61,122,0.25)] shrink-0">
              <Flame className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="font-archivo text-base sm:text-lg text-white tracking-wide uppercase leading-tight">
                Burn $BATON for {coin.name}
              </h3>
              <p className="font-mono text-[11px] text-zinc-400">
                Real Solana On-Chain SPL Token Burn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State Screen */}
        {burnState === "success" && txSignature ? (
          <div className="py-6 space-y-6 text-center font-mono animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-acid/15 border border-acid/40 text-acid mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(212,255,63,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="font-archivo text-2xl text-white uppercase">
                BURN CONFIRMED ON SOLANA!
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-space">
                <span className="text-acid font-bold">
                  {amount.toLocaleString()} $BATON
                </span>{" "}
                permanently burned on-chain and credited to {coin.name} ($
                {coin.ticker}) score.
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
                className="text-acid hover:underline inline-flex items-center gap-1 font-bold shrink-0 text-xs"
              >
                <span>View on Solscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-acid text-black font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(212,255,63,0.3)] hover:bg-acid-dim transition-all"
            >
              Done &amp; Return
            </button>
          </div>
        ) : (
          <>
            {/* 1. Progress Bar to Next Tier */}
            <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/50 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Zap className="w-3.5 h-3.5 text-lime-400" />
                  <span>Next Tier:</span>
                  <span className="text-white font-bold uppercase">
                    {nextTierName}
                  </span>
                </div>
                <span className="text-lime-400 font-bold">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Track with Smooth Gradient */}
              <div className="w-full h-3 rounded-full bg-zinc-950 border border-white/10 overflow-hidden p-0.5 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime-400 via-amber-400 to-rose-500 shadow-[0_0_12px_rgba(212,255,63,0.5)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Current: {currentBurned.toLocaleString()} $BATON</span>
                {remainingToNext > 0 ? (
                  <span>
                    Remaining:{" "}
                    <strong className="text-white font-semibold">
                      {remainingToNext.toLocaleString()} $BATON
                    </strong>
                  </span>
                ) : (
                  <span className="text-lime-400 font-bold">★ Diamond League Reached</span>
                )}
              </div>
            </div>

            {/* 2. Amount Input & Wallet Balance */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-400 font-medium">Burn Amount ($BATON):</label>
                {connected && (
                  <div className="text-zinc-400 flex items-center gap-1 text-[11px]">
                    <Wallet className="w-3 h-3 text-acid" />
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
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-3.5 text-lg font-bold text-white placeholder:text-zinc-600 focus:border-acid focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-4 text-xs font-black text-acid uppercase tracking-wider pointer-events-none">
                  $BATON
                </span>
              </div>

              {/* Quick Increment Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount((prev) => prev + q)}
                    disabled={isProcessing}
                    className="py-1.5 rounded-lg border border-white/10 bg-zinc-900/60 hover:border-white/25 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    +{q.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleMaxClick}
                  disabled={isProcessing || !batonBalance}
                  className="py-1.5 rounded-lg border border-acid/40 bg-acid/10 text-acid font-bold text-xs hover:bg-acid hover:text-black disabled:opacity-40 transition-all"
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
            <div className="flex gap-3 pt-2 font-mono">
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
                    className="flex-1 py-3.5 rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBurnSubmit}
                    disabled={isProcessing || amount <= 0}
                    className="flex-[2] py-3.5 rounded-xl bg-acid text-black text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(212,255,63,0.3)] hover:bg-acid-dim active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
