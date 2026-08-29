"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { ArrowDown, Zap, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const PRESETS = [0.1, 0.5, 1.0];

export function QuickSwapCard() {
  const { connected } = useWallet();
  const [solAmount, setSolAmount] = useState<string>("0.5");
  const [estimatedBaton, setEstimatedBaton] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [solPriceUsd, setSolPriceUsd] = useState<number>(200);
  const [batonPriceUsd, setBatonPriceUsd] = useState<number>(0.0004);

  // Fetch live Jupiter / DexScreener Price API
  const fetchPrices = useCallback(async () => {
    setLoadingRate(true);
    try {
      // 1. Fetch from Jupiter Price API
      const jupRes = await fetch(
        `https://api.jup.ag/price/v2?ids=${SOL_MINT},${BATON_MINT}`
      );

      if (jupRes.ok) {
        const jupData = await jupRes.json();
        const solP = parseFloat(jupData?.data?.[SOL_MINT]?.price || "0");
        const batonP = parseFloat(jupData?.data?.[BATON_MINT]?.price || "0");

        if (solP > 0) setSolPriceUsd(solP);
        if (batonP > 0) setBatonPriceUsd(batonP);
        return;
      }
    } catch {
      // Fallback to market-stats & coins API
      try {
        const [mRes, cRes] = await Promise.all([
          fetch("/api/market-stats"),
          fetch("/api/coins"),
        ]);

        if (mRes.ok) {
          const mData = await mRes.json();
          const solCoin = Array.isArray(mData.data)
            ? mData.data.find((c: { symbol: string }) => c.symbol === "SOL")
            : null;
          if (solCoin?.price) setSolPriceUsd(solCoin.price);
        }

        if (cRes.ok) {
          const cData = await cRes.json();
          const batonCoin = Array.isArray(cData.data)
            ? cData.data.find((c: { ticker: string }) => c.ticker === "BATON")
            : null;
          if (batonCoin?.priceUsd) setBatonPriceUsd(batonCoin.priceUsd);
        }
      } catch (e) {
        console.warn("Fallback price fetch error:", e);
      }
    } finally {
      setLoadingRate(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Recalculate dynamic $BATON amount
  useEffect(() => {
    const solVal = Math.max(0, parseFloat(solAmount) || 0);
    const usdVal = solVal * solPriceUsd;
    const effBatonPrice = batonPriceUsd > 0 ? batonPriceUsd : 0.0004;
    setEstimatedBaton(Math.floor(usdVal / effBatonPrice));
  }, [solAmount, solPriceUsd, batonPriceUsd]);

  return (
    <div className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-lg select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          QUICK SWAP ROUTE
        </span>
        <div className="flex items-center gap-1.5">
          {loadingRate && (
            <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
          )}
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5 font-medium">
            SLIPPAGE: 0.5%
          </span>
        </div>
      </div>

      {/* Input: Pay SOL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>YOU PAY</span>
          <span className="text-[10px] text-zinc-500">
            1 SOL ≈ ${solPriceUsd.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between bg-zinc-950/80 border border-white/10 rounded-lg px-3 py-2 focus-within:border-amber-500/50 transition-colors">
          <input
            type="number"
            step="0.05"
            min="0.01"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-white focus:outline-none font-mono"
            placeholder="0.0"
          />
          <span className="text-xs font-bold text-amber-400 pl-2">SOL</span>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setSolAmount(preset.toString())}
              className={`py-1 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                solAmount === preset.toString()
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border-white/5"
              }`}
            >
              {preset} SOL
            </button>
          ))}
        </div>
      </div>

      {/* Route Arrow */}
      <div className="flex justify-center -my-1">
        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
          <ArrowDown className="w-3 h-3" />
        </div>
      </div>

      {/* Output: Receive $BATON */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>YOU RECEIVE (EST.)</span>
          <span>ATTENTION ASSET</span>
        </div>

        <div className="flex items-center justify-between bg-zinc-950/80 border border-white/10 rounded-lg px-3 py-2">
          <span className="text-sm font-bold text-white">
            {formatNumber(estimatedBaton)}
          </span>
          <span className="text-xs font-bold text-amber-400 pl-2">$BATON</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-1">
        {!connected ? (
          <div className="w-full flex justify-center [&_.wallet-adapter-button]:!w-full [&_.wallet-adapter-button]:!justify-center [&_.wallet-adapter-button]:!bg-amber-500 [&_.wallet-adapter-button]:!text-black [&_.wallet-adapter-button]:!font-bold [&_.wallet-adapter-button]:!text-xs [&_.wallet-adapter-button]:!rounded-lg [&_.wallet-adapter-button]:!h-9">
            <WalletMultiButton />
          </div>
        ) : (
          <Link
            href={`/terminal?outputMint=${BATON_MINT}&outputSymbol=BATON&amount=${solAmount}`}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 text-center uppercase tracking-wider"
          >
            <span>[ EXECUTE SWAP VIA JUPITER ]</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default QuickSwapCard;
