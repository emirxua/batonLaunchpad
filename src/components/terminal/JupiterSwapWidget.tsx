"use client";

import React, { useState } from "react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

export function JupiterSwapWidget({
  outputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Jupiter resmi dark tema swap URL'i
  const jupUrl = `https://jup.ag/swap/SOL-${outputMint}?theme=dark`;

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col overflow-hidden font-mono shadow-2xl">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 tracking-wide">
            JUPITER ROUTE: ${outputSymbol}
          </span>
        </div>
        <span className="text-[10px] text-zinc-400">
          Non-Custodial DEX
        </span>
      </div>

      {/* Widget Container - Tam oturan responsive iframe alanı */}
      <div className="w-full h-[460px] relative bg-zinc-950 p-1 flex items-center justify-center">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950 text-zinc-500 text-xs font-mono">
            <span className="w-5 h-5 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            <span>CONNECTING JUPITER ROUTE...</span>
          </div>
        )}
        <iframe
          src={jupUrl}
          title="Jupiter DEX Terminal"
          onLoad={() => setIframeLoaded(true)}
          className="w-full h-full border-0 rounded-lg bg-transparent"
          allow="clipboard-read; clipboard-write; payment"
        />
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
