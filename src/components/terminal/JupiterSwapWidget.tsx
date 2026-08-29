"use client";

import React, { useEffect, useState } from "react";
import { ArrowRightLeft, ShieldCheck, Zap, Loader2 } from "lucide-react";

interface JupiterSwapWidgetProps {
  initialOutputMint?: string;
  outputMint?: string;
  targetSymbol?: string;
  className?: string;
}

const DEFAULT_BATON_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";

export function JupiterSwapWidget({
  initialOutputMint,
  outputMint,
  targetSymbol = "BATON",
  className = "",
}: JupiterSwapWidgetProps) {
  const targetMint = outputMint || initialOutputMint || DEFAULT_BATON_MINT;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const scriptId = "jupiter-terminal-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initJupiter = () => {
      if (typeof window !== "undefined" && (window as unknown as { Jupiter?: { init: (props: unknown) => void } }).Jupiter) {
        try {
          const container = document.getElementById("integrated-terminal");
          if (container) {
            container.innerHTML = "";
          }

          const rpcEndpoint =
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
            "https://rpc.ankr.com/solana";

          (window as unknown as { Jupiter: { init: (props: unknown) => void } }).Jupiter.init({
            displayMode: "integrated",
            integratedTargetId: "integrated-terminal",
            endpoint: rpcEndpoint,
            formProps: {
              initialInputMint: "So11111111111111111111111111111111111111112", // SOL
              initialOutputMint: targetMint,
              fixedOutputMint: false,
            },
            palette: {
              background: "#09090b",
              primary: "#f59e0b",
            },
            containerStyles: {
              zIndex: 10,
              maxHeight: "560px",
              borderRadius: "16px",
            },
          });
          setIsReady(true);
        } catch (err) {
          console.warn("Jupiter Terminal init warning:", err);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = initJupiter;
      document.head.appendChild(script);
    } else {
      initJupiter();
    }
  }, [targetMint]);

  return (
    <div
      className={`w-full bg-[#0D0E12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}
    >
      {/* Widget Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-zinc-950/60 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <span>Jupiter DEX Swap</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Target: <strong className="text-orange-400">${targetSymbol}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          <span>Non-Custodial</span>
        </div>
      </div>

      {/* Jupiter Terminal Target Container */}
      <div className="w-full flex flex-col items-center justify-center min-h-[500px] bg-zinc-950 p-2 relative">
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500 font-mono text-xs z-0">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span>Connecting Jupiter Terminal…</span>
          </div>
        )}
        <div id="integrated-terminal" className="w-full min-h-[480px] relative z-10" />
      </div>

      {/* Widget Footer */}
      <div className="p-3 border-t border-white/5 bg-zinc-950/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-orange-400" />
          <span>Solana Direct DEX Routing</span>
        </div>
        <span className="text-zinc-600 truncate max-w-[120px]">
          {targetMint.slice(0, 4)}…{targetMint.slice(-4)}
        </span>
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
