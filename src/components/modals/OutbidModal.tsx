"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Coin } from "@/types/coin";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { prepareRealBurnTransaction } from "@/lib/burn";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
import { formatNumber } from "@/lib/utils";
import dynamic from "next/dynamic";
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink, Flame } from "lucide-react";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const CATEGORIES = ["Mascots", "Agents", "Memes", "Utility", "DeFi", "Community"];

interface OutbidModalProps {
  targetCoin?: Coin | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type StepState = "idle" | "awaiting_approval" | "confirming" | "success" | "error";

export function OutbidModal({
  targetCoin,
  isOpen,
  onClose,
  onSuccess,
}: OutbidModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { batonBalance, isLoading: balanceLoading, refetch } = useUserBatonBalance();

  const [tokenAddress, setTokenAddress] = useState<string>(targetCoin?.mintAddress || "");
  const [category, setCategory] = useState<string>(targetCoin?.category || "Mascots");
  const [amount, setAmount] = useState<number>(1000);
  const [step, setStep] = useState<StepState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with targetCoin if passed
  useEffect(() => {
    if (targetCoin) {
      setTokenAddress(targetCoin.mintAddress);
      setCategory(targetCoin.category || "Mascots");
      const currentBurn = targetCoin.totalBurnedBaton || 0;
      // Target + 5% or minimum 1000
      const minRequired = currentBurn === 0 ? 1000 : Math.ceil(currentBurn * 1.05);
      setAmount(minRequired);
    }
  }, [targetCoin]);

  const currentBurn = targetCoin?.totalBurnedBaton || 0;
  const minRequired = useMemo(() => {
    return currentBurn === 0 ? 1000 : Math.ceil(currentBurn * 1.05);
  }, [currentBurn]);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setStep("idle");
      setErrorMessage(null);
      setTxSignature(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteBurn = async () => {
    if (!publicKey || !connected) {
      setErrorMessage("Please connect your Solana wallet first.");
      setStep("error");
      return;
    }

    if (!tokenAddress.trim()) {
      setErrorMessage("Please specify a valid token Contract Address (CA).");
      setStep("error");
      return;
    }

    if (amount <= 0) {
      setErrorMessage("Burn amount must be greater than zero.");
      setStep("error");
      return;
    }

    setErrorMessage(null);
    setStep("awaiting_approval");

    try {
      // 1. Build real SPL Token Burn Transaction
      const { transaction } = await prepareRealBurnTransaction({
        connection,
        userPublicKey: publicKey,
        burnAmount: amount,
        targetCoinTicker: targetCoin?.ticker || "CUSTOM",
        targetMint: tokenAddress.trim(),
      });

      // 2. Request user signature in wallet
      const signature = await sendTransaction(transaction, connection, {
        maxRetries: 3,
        preflightCommitment: "processed",
      });

      setTxSignature(signature);
      setStep("confirming");

      // 3. Confirm transaction on-chain
      const confirmation = await connection.confirmTransaction(signature, "confirmed");

      if (confirmation.value.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
      }

      // 4. Record burn to runtime indexer
      try {
        await fetch("/api/burns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: signature,
            coinId: targetCoin?.id || tokenAddress.trim(),
            amount,
            userAddress: publicKey.toBase58(),
          }),
        });
      } catch (e) {
        console.warn("Backend burn record failed (still valid on-chain):", e);
      }

      refetch();
      setStep("success");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Outbid burn error:", err);
      const msg = err instanceof Error ? err.message : "Failed to execute burn transaction";
      setErrorMessage(msg);
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-lg bg-zinc-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
            <span className="font-bold text-sm text-white uppercase tracking-wider">
              {targetCoin ? `OUTBID SPOT: $${targetCoin.ticker}` : "CLAIM ATTENTION SPOT"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Target Info Banner */}
          {targetCoin && (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-amber-500/20 flex items-center justify-between text-[11px]">
              <div>
                <div className="text-zinc-500 uppercase">Target Current Burn:</div>
                <div className="font-bold text-white">
                  {formatNumber(currentBurn)} $BATON
                </div>
              </div>
              <div className="text-right">
                <div className="text-zinc-500 uppercase">Min. To Overtake (+5%):</div>
                <div className="font-bold text-amber-400">
                  {formatNumber(minRequired)} $BATON
                </div>
              </div>
            </div>
          )}

          {/* Token Contract Address Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">
              Token Contract Address (CA)
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Enter Solana token mint address..."
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500/50 transition-colors"
              disabled={step === "awaiting_approval" || step === "confirming"}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 uppercase tracking-wider block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500/50 cursor-pointer"
              disabled={step === "awaiting_approval" || step === "confirming"}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Burn Amount Input & Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <label className="uppercase tracking-wider">Burn Amount ($BATON)</label>
              <span>
                Wallet Balance:{" "}
                <span className="text-amber-400 font-bold">
                  {balanceLoading ? "..." : formatNumber(batonBalance)}
                </span>
              </span>
            </div>

            <input
              type="number"
              min={minRequired}
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500/50 font-mono transition-colors"
              disabled={step === "awaiting_approval" || step === "confirming"}
            />

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[minRequired, minRequired + 5000, minRequired + 25000, minRequired + 100000].map(
                (preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    +{formatNumber(preset - minRequired || preset)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Status / Feedback Area */}
          {step === "awaiting_approval" && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Awaiting signature in your Solana wallet…</span>
            </div>
          )}

          {step === "confirming" && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Confirming on-chain transaction…</span>
            </div>
          )}

          {step === "success" && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>On-chain burn verified successfully!</span>
              </div>
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] underline flex items-center gap-1 hover:text-white"
                >
                  <span>View Solscan Transaction</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {step === "error" && errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-all">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {!connected ? (
            <div className="[&_.wallet-adapter-button]:!bg-amber-500 [&_.wallet-adapter-button]:!text-black [&_.wallet-adapter-button]:!font-bold [&_.wallet-adapter-button]:!text-xs [&_.wallet-adapter-button]:!rounded-lg [&_.wallet-adapter-button]:!h-9">
              <WalletMultiButton />
            </div>
          ) : step === "success" ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider transition-colors"
            >
              Close
            </button>
          ) : (
            <button
              type="button"
              disabled={step === "awaiting_approval" || step === "confirming"}
              onClick={handleExecuteBurn}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {step === "awaiting_approval" || step === "confirming" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm &amp; Burn $BATON</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OutbidModal;
