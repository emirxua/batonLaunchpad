"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

export function JupiterSwapWidget({
  outputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [inputAmount, setInputAmount] = useState("0.5");
  const [outputAmount, setOutputAmount] = useState("0");
  const [quoteResponse, setQuoteResponse] = useState<unknown>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [priceImpact, setPriceImpact] = useState("< 0.1%");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const handleAmountChange = (val: string) => {
    const sanitized = val.replace(",", ".").replace(/[^0-9.]/g, "");
    setInputAmount(sanitized);
  };

  const fetchQuote = useCallback(
    async (rawAmount: string) => {
      if (!rawAmount || rawAmount === "." || rawAmount === "0") {
        setOutputAmount("0");
        setQuoteResponse(null);
        setErrorMsg(null);
        return;
      }

      const val = parseFloat(rawAmount);
      if (isNaN(val) || val <= 0) {
        setOutputAmount("0");
        setQuoteResponse(null);
        setErrorMsg(null);
        return;
      }

      try {
        setLoadingQuote(true);
        setErrorMsg(null);
        const lamports = Math.floor(val * 1e9);

        const res = await fetch(
          `/api/jupiter/quote?outputMint=${outputMint}&amount=${lamports}`
        );
        const data = await res.json();

        if (data && data.outAmount) {
          setQuoteResponse(data);
          const decimals = outputMint.endsWith("pump") ? 6 : 9;
          const outTokens = Number(data.outAmount) / Math.pow(10, decimals);
          setOutputAmount(
            outTokens >= 1000
              ? outTokens.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : outTokens.toLocaleString("en-US", { maximumFractionDigits: 2 })
          );
          setPriceImpact(
            data.priceImpactPct
              ? `${(parseFloat(data.priceImpactPct) * 100).toFixed(2)}%`
              : "< 0.1%"
          );
        } else {
          throw new Error("No route");
        }
      } catch {
        setErrorMsg("Route not available");
        setOutputAmount("0");
        setQuoteResponse(null);
      } finally {
        setLoadingQuote(false);
      }
    },
    [outputMint]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote(inputAmount);
    }, 250);
    return () => clearTimeout(timer);
  }, [inputAmount, fetchQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!quoteResponse) return;

    try {
      setSwapping(true);
      setErrorMsg(null);
      setTxSuccess(null);

      const swapRes = await fetch("/api/jupiter/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: publicKey.toBase58(),
        }),
      });

      const swapData = await swapRes.json();
      if (!swapData.swapTransaction) throw new Error("Transaction build failed");

      const binaryString = window.atob(swapData.swapTransaction);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const transaction = VersionedTransaction.deserialize(bytes);
      const txid = await sendTransaction(transaction, connection);
      setTxSuccess(txid);
      fetchQuote(inputAmount);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Swap failed";
      setErrorMsg(msg);
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col font-mono shadow-2xl overflow-hidden select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 tracking-wide">
            OUTBID SWAP
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400">Powered by Jupiter</span>
          <button
            type="button"
            onClick={() => fetchQuote(inputAmount)}
            className="text-[10px] text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {loadingQuote ? "UPDATING..." : "REFRESH"}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        {/* Pay Section */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center text-[11px] text-zinc-400 mb-1.5">
            <span>YOU PAY</span>
            <span>SOL</span>
          </div>
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={inputAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-lg font-bold text-zinc-100 outline-none w-full font-mono"
            />
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded shrink-0">
              SOL
            </span>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            {["0.1", "0.5", "1", "5"].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setInputAmount(amt)}
                className={`text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer ${
                  inputAmount === amt
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300 font-bold"
                    : "border-white/5 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {amt} SOL
              </button>
            ))}
          </div>
        </div>

        {/* Receive Section */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center text-[11px] text-zinc-400 mb-1.5">
            <span>YOU RECEIVE (ESTIMATED)</span>
            <span className="text-emerald-400 text-[10px] font-bold">Best Route</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-zinc-100 truncate">
              {loadingQuote ? "Calculating..." : outputAmount}
            </span>
            <span className="text-xs font-bold text-zinc-300 bg-zinc-800 border border-white/5 px-2 py-1 rounded shrink-0">
              ${outputSymbol}
            </span>
          </div>
        </div>

        {/* Route Info */}
        <div className="bg-zinc-900/20 border border-white/5 rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px] text-zinc-400">
          <div className="flex justify-between">
            <span>Routing Engine</span>
            <span className="text-zinc-300 font-bold">Jupiter Ultra API</span>
          </div>
          <div className="flex justify-between">
            <span>Price Impact</span>
            <span className="text-emerald-400 font-bold">{priceImpact}</span>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded">
            {errorMsg}
          </div>
        )}
        {txSuccess && (
          <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded truncate">
            Confirmed: {txSuccess.slice(0, 10)}...{txSuccess.slice(-8)}
          </div>
        )}

        {/* Swap Action */}
        <button
          type="button"
          onClick={handleSwap}
          disabled={swapping || loadingQuote}
          className="w-full py-3 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-1 cursor-pointer active:scale-98"
        >
          {swapping ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              <span>CONFIRMING ON SOLANA...</span>
            </>
          ) : !connected ? (
            "CONNECT WALLET"
          ) : (
            `SWAP SOL FOR $${outputSymbol}`
          )}
        </button>
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
