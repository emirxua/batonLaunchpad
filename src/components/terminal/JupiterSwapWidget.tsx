"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  Zap,
  Loader2,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const SOL_DECIMALS = 9;
const PRESETS = [0.1, 0.5, 1.0, 5.0];

export function JupiterSwapWidget({
  outputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const { connected } = useWallet();
  const [solAmount, setSolAmount] = useState<string>("0.5");
  const [outAmount, setOutAmount] = useState<string>("0");
  const [solPrice, setSolPrice] = useState<number>(200);
  const [tokenPrice, setTokenPrice] = useState<number>(0.0004);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [priceImpact, setPriceImpact] = useState<string>("< 0.1%");

  // Fetch real-time quotes from Jupiter Quote API v6 & Price API v2
  const fetchQuoteAndPrice = useCallback(async () => {
    if (!outputMint) return;
    setLoadingQuote(true);

    try {
      // 1. Fetch live prices from Jupiter Price API v2
      const priceRes = await fetch(
        `https://api.jup.ag/price/v2?ids=${SOL_MINT},${outputMint}`
      );
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        const solP = parseFloat(priceData?.data?.[SOL_MINT]?.price || "0");
        const tokP = parseFloat(priceData?.data?.[outputMint]?.price || "0");
        if (solP > 0) setSolPrice(solP);
        if (tokP > 0) setTokenPrice(tokP);
      }

      // 2. Fetch live route quote from Jupiter Quote API v6
      const numSol = parseFloat(solAmount) || 0;
      if (numSol > 0) {
        const lamports = Math.floor(numSol * 10 ** SOL_DECIMALS);
        const quoteRes = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${outputMint}&amount=${lamports}&slippageBps=50`
        );

        if (quoteRes.ok) {
          const quoteData = await quoteRes.json();
          if (quoteData?.outAmount) {
            // Assume 6 decimals for standard pump/spl or compute from quote
            const rawOut = parseFloat(quoteData.outAmount);
            const calculatedOut = rawOut > 10000 ? rawOut / 10 ** 6 : rawOut;
            setOutAmount(calculatedOut.toLocaleString("en-US", { maximumFractionDigits: 2 }));
          }
          if (quoteData?.priceImpactPct) {
            const impact = parseFloat(quoteData.priceImpactPct) * 100;
            setPriceImpact(`${impact < 0.01 ? "< 0.01" : impact.toFixed(2)}%`);
          }
        } else {
          // Fallback calculation using USD prices
          const usdVal = numSol * (solPrice || 200);
          const effPrice = tokenPrice > 0 ? tokenPrice : 0.0004;
          const est = Math.floor(usdVal / effPrice);
          setOutAmount(formatNumber(est));
        }
      }
    } catch {
      // Fallback calculation using USD prices
      const numSol = parseFloat(solAmount) || 0;
      const usdVal = numSol * (solPrice || 200);
      const effPrice = tokenPrice > 0 ? tokenPrice : 0.0004;
      const est = Math.floor(usdVal / effPrice);
      setOutAmount(formatNumber(est));
    } finally {
      setLoadingQuote(false);
    }
  }, [outputMint, solAmount, solPrice, tokenPrice]);

  useEffect(() => {
    fetchQuoteAndPrice();
    const interval = setInterval(fetchQuoteAndPrice, 15_000);
    return () => clearInterval(interval);
  }, [fetchQuoteAndPrice]);

  const handleExecuteSwap = () => {
    // Open official Jupiter Swap direct route with pre-populated pair and amount
    const jupDirectUrl = `https://jup.ag/swap/SOL-${outputMint}?inAmount=${solAmount}`;
    window.open(jupDirectUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col overflow-hidden font-mono shadow-2xl select-none">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 tracking-wide flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>JUPITER ROUTE: ${outputSymbol}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => fetchQuoteAndPrice()}
          className="text-zinc-500 hover:text-amber-400 transition-colors p-1"
          title="Refresh Quote"
        >
          <RefreshCw className={`w-3 h-3 ${loadingQuote ? "animate-spin text-amber-400" : ""}`} />
        </button>
      </div>

      {/* Body: Direct Execution Terminal Form */}
      <div className="p-4 space-y-3.5">
        {/* Input: You Pay (SOL) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>YOU PAY</span>
            <span className="text-[10px] text-zinc-500">
              1 SOL ≈ ${solPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2.5 focus-within:border-amber-500/50 transition-colors">
            <input
              type="number"
              step="0.05"
              min="0.01"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              className="w-full bg-transparent text-base font-bold text-white focus:outline-none font-mono"
              placeholder="0.0"
            />
            <div className="flex items-center gap-1.5 pl-2 shrink-0">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                S
              </div>
              <span className="text-xs font-bold text-amber-400">SOL</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSolAmount(preset.toString())}
                className={`py-1 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                  solAmount === preset.toString()
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border-white/5"
                }`}
              >
                {preset} SOL
              </button>
            ))}
          </div>
        </div>

        {/* Route Separator Icon */}
        <div className="flex items-center justify-center -my-1">
          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 shadow-md">
            <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Output: You Receive */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>YOU RECEIVE (ESTIMATED)</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Best Routing</span>
            </span>
          </div>

          <div className="flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {loadingQuote ? (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Fetching route…</span>
                </div>
              ) : (
                <span className="text-base font-bold text-white truncate">
                  {outAmount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 pl-2 shrink-0">
              <span className="text-xs font-bold text-amber-400">
                ${outputSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Route Details Box */}
        <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-white/5 text-[10px] space-y-1 text-zinc-400">
          <div className="flex items-center justify-between">
            <span>Routing Engine</span>
            <span className="text-zinc-200 font-bold">Jupiter Ultra v6</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Max Slippage</span>
            <span className="text-zinc-200 font-bold">0.5%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Price Impact</span>
            <span className="text-emerald-400 font-bold">{priceImpact}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1 space-y-2">
          {!connected ? (
            <div className="w-full flex justify-center [&_.wallet-adapter-button]:!w-full [&_.wallet-adapter-button]:!justify-center [&_.wallet-adapter-button]:!bg-amber-500 [&_.wallet-adapter-button]:!text-black [&_.wallet-adapter-button]:!font-bold [&_.wallet-adapter-button]:!text-xs [&_.wallet-adapter-button]:!rounded-lg [&_.wallet-adapter-button]:!h-10">
              <WalletMultiButton />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleExecuteSwap}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 text-center uppercase tracking-wider cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>SWAP ON JUPITER DEX</span>
            </button>
          )}

          {/* Direct Outlink */}
          <div className="flex items-center justify-between text-[10px] px-1 text-zinc-500">
            <a
              href={`https://jup.ag/swap/SOL-${outputMint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>Open in Jupiter App</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href={`https://solscan.io/token/${outputMint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              View on Solscan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
