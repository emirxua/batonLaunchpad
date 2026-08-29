"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { ArrowDown, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
const PRESETS = [0.1, 0.5, 1.0];

export function QuickSwapCard() {
  const { connected } = useWallet();
  const [solAmount, setSolAmount] = useState<string>("0.5");
  const [estimatedBaton, setEstimatedBaton] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [solPriceUsd, setSolPriceUsd] = useState<number>(200);

  // Fetch live SOL & BATON estimated rate
  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      setLoadingRate(true);
      try {
        // Fetch SOL price from market stats
        const res = await fetch("/api/market-stats");
        if (res.ok) {
          const json = await res.json();
          const solCoin = Array.isArray(json.data)
            ? json.data.find((c: { symbol: string }) => c.symbol === "SOL")
            : null;
          if (solCoin?.price && !cancelled) {
            setSolPriceUsd(solCoin.price);
          }
        }
      } catch (e) {
        console.warn("Could not fetch latest SOL price:", e);
      } finally {
        if (!cancelled) setLoadingRate(false);
      }
    }

    fetchRate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate estimated $BATON tokens (~$0.0004 assumption or live relative cap)
  useEffect(() => {
    const solVal = parseFloat(solAmount) || 0;
    const usdVal = solVal * solPriceUsd;
    // Assuming estimated price per BATON ~$0.00035 to $0.0005
    const estimatedPriceBaton = 0.00042;
    setEstimatedBaton(Math.floor(usdVal / estimatedPriceBaton));
  }, [solAmount, solPriceUsd]);

  return (
    <div className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-lg select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          QUICK SWAP ROUTE
        </span>
        <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5 font-medium">
          SLIPPAGE: 0.5%
        </span>
      </div>

      {/* Input: Pay SOL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>YOU PAY</span>
          <span>SOLANA</span>
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
