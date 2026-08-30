"use client";

import React, { useState } from "react";
import { Coin } from "@/types/coin";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { formatNumber } from "@/lib/utils";
import { prepareRealBurnTransaction } from "@/lib/burn";
import {
  Flame,
  X,
  Wallet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

interface BurnModalProps {
  coin: Coin | null;
  isOpen: boolean;
  initialAmount?: number;
  onClose: () => void;
  onSuccess?: (coinId: string, burnedAmount: number) => void;
}

const DEAD_WALLET = "1111111111111111111111111111111111111111";

export const BurnModal: React.FC<BurnModalProps> = ({
  coin,
  isOpen,
  initialAmount = 50000,
  onClose,
  onSuccess,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [amount, setAmount] = useState<number>(initialAmount);
  const [burning, setBurning] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedDeadWallet, setCopiedDeadWallet] = useState<boolean>(false);
  const [copiedCA, setCopiedCA] = useState<boolean>(false);

  if (!isOpen || !coin) return null;

  const handleCopyDeadWallet = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(DEAD_WALLET);
    setCopiedDeadWallet(true);
    setTimeout(() => setCopiedDeadWallet(false), 2000);
  };

  const handleCopyCA = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coin?.mintAddress) {
      navigator.clipboard.writeText(coin.mintAddress);
      setCopiedCA(true);
      setTimeout(() => setCopiedCA(false), 2000);
    }
  };

  // ── Dynamic Client-side Reactive Rank Impact Calculation ────────────────
  const currentTotal = coin.totalBurnedBaton || 0;
  const projectedTotal = currentTotal + (amount || 0);

  const getEstimatedRankImpact = (proj: number, amt: number) => {
    if (amt <= 0) return { label: "Enter amount to see rank impact", color: "text-zinc-500 bg-zinc-800 border-zinc-700" };
    if (proj >= 4_820_000) return { label: "👑 Takes #1 Spot (King of the Hill Champion)", color: "text-amber-400 bg-amber-500/20 border-amber-500/40 font-black" };
    if (proj >= 3_250_000) return { label: "🥈 #2 Silver Podium (+4 Ranks UP)", color: "text-zinc-300 bg-zinc-700/40 border-zinc-500/40 font-bold" };
    if (proj >= 2_480_000) return { label: "🥉 #3 Bronze Podium (+3 Ranks UP)", color: "text-orange-400 bg-orange-500/20 border-orange-500/40 font-bold" };
    if (proj >= 1_420_000) return { label: "🚀 Top 5 Contender (+2 Ranks UP)", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40 font-bold" };
    return { label: "+1 Rank UP (⚡ Attention Signal Boost)", color: "text-amber-300 bg-amber-500/10 border-amber-500/20 font-bold" };
  };

  const rankImpact = getEstimatedRankImpact(projectedTotal, amount);

  // ── On-Demand Burn Transaction Trigger ────────────────────────────────────
  const handleExecuteBurn = async () => {
    setErrorMessage(null);
    setTxSignature(null);

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setErrorMessage("Please enter a valid $BATON burn amount.");
      return;
    }

    try {
      setBurning(true);

      // Construct verified Solana SPL token burn / transfer to dead wallet transaction
      const { transaction } = await prepareRealBurnTransaction({
        connection,
        userPublicKey: publicKey,
        burnAmount: amount,
        targetCoinTicker: coin.ticker,
        targetMint: coin.mintAddress,
      });

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      setTxSignature(signature);

      if (onSuccess) {
        onSuccess(coin.id, amount);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User rejected") || msg.includes("rejected")) {
        setErrorMessage("Transaction was cancelled in your wallet.");
      } else if (msg.includes("insufficient") || msg.includes("0x1")) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden cursor-default"
      >
        {/* Top Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white uppercase tracking-wider">
                Burn $BATON &amp; Boost Rank
              </h3>
              <span className="text-[10px] text-zinc-500 block">
                Permanent Deflationary Ranking Auction
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Target Token Info Card ─────────────────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
            Target Token for Boost
          </span>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {coin.imageUrl ? (
                <img
                  src={coin.imageUrl}
                  alt={coin.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm shrink-0">
                  ${coin.ticker.slice(0, 3)}
                </div>
              )}
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-zinc-950 dark:text-white block truncate">
                  {coin.name} (${coin.ticker})
                </span>
                <span className="text-[11px] text-zinc-500 font-mono truncate block">
                  {coin.mintAddress ? `${coin.mintAddress.slice(0, 6)}…${coin.mintAddress.slice(-6)}` : "—"}
                </span>
              </div>
            </div>

            {coin.mintAddress && (
              <button
                type="button"
                onClick={handleCopyCA}
                className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-amber-500/20 text-zinc-700 dark:text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                title="Copy Token CA"
              >
                {copiedCA ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* ── Burn Amount Input ──────────────────────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-[11px] text-zinc-500">
            <span>$BATON AMOUNT TO BURN</span>
            <span className="text-amber-500 dark:text-amber-400 font-bold">
              100% Permanently Burned
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2">
            <input
              type="number"
              min="1"
              value={amount || ""}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="50,000"
              className="bg-transparent text-xl font-black text-zinc-950 dark:text-white outline-none w-full font-mono placeholder:text-zinc-600"
            />
            <span className="font-extrabold text-xs text-amber-500 shrink-0">
              $BATON
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {[10000, 50000, 100000, 500000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer font-bold ${
                  amount === preset
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                    : "border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-200"
                }`}
              >
                +{formatNumber(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Estimated Rank Impact Badge ────────────────────────────────── */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 text-xs">
          <span className="text-zinc-500 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            ESTIMATED IMPACT:
          </span>
          <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[11px] border ${rankImpact.color}`}>
            {rankImpact.label}
          </span>
        </div>

        {/* ── Dead Wallet Address Display ────────────────────────────────── */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 space-y-1 text-xs">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
            Verifiable Solana Dead Wallet (Incinerator)
          </span>
          <div className="flex items-center justify-between gap-2 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
            <span className="truncate max-w-[280px]">{DEAD_WALLET}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyDeadWallet}
                className="hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                title="Copy Dead Wallet Address"
              >
                {copiedDeadWallet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`https://solscan.io/account/${DEAD_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors p-0.5"
                title="View on Solscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Error & Success Banners ────────────────────────────────────── */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {txSignature && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex flex-col gap-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Burn Successful! {formatNumber(amount)} $BATON permanently burned.</span>
            </div>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[10px] text-emerald-300 flex items-center gap-1"
            >
              <span>View On-Chain Proof on Solscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* ── Burn & Boost Now CTA Button ────────────────────────────────── */}
        <button
          type="button"
          onClick={handleExecuteBurn}
          disabled={burning || amount <= 0}
          className={`w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            !connected
              ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
              : burning
              ? "bg-amber-500/50 text-zinc-950 cursor-wait"
              : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/25 active:scale-[0.99]"
          }`}
        >
          {burning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>SIGNING &amp; BURNING ON-CHAIN…</span>
            </>
          ) : !connected ? (
            <span>CONNECT WALLET TO BURN &amp; BOOST</span>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-current" />
              <span>Burn &amp; Boost Now ({formatNumber(amount)} $BATON)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BurnModal;
