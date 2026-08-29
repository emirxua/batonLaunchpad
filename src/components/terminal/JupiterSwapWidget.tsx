"use client";

import React, { useEffect, useRef } from "react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
  initialOutputMint?: string;
  targetSymbol?: string;
  className?: string;
}

export function JupiterSwapWidget({
  outputMint,
  outputSymbol,
  initialOutputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  targetSymbol = "BATON",
  className = "",
}: JupiterSwapWidgetProps) {
  const finalMint = outputMint || initialOutputMint;
  const finalSymbol = outputSymbol || targetSymbol;
  const isLoadedRef = useRef(false);

  useEffect(() => {
    const scriptId = "jup-terminal-script";

    const initTerminal = () => {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { Jupiter?: { init: (props: unknown) => void } }).Jupiter
      ) {
        try {
          const rpcEndpoint =
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
            "https://rpc.ankr.com/solana";

          const container = document.getElementById("integrated-terminal");
          if (container) {
            container.innerHTML = "";
          }

          (window as unknown as { Jupiter: { init: (props: unknown) => void } }).Jupiter.init({
            displayMode: "integrated",
            integratedTargetId: "integrated-terminal",
            endpoint: rpcEndpoint,
            strictTokenList: false,
            defaultExplorer: "Solscan",
            formProps: {
              initialInputMint: "So11111111111111111111111111111111111111112",
              initialOutputMint: finalMint,
              initialAmount: "0.1",
              fixedOutputMint: false,
            },
            palette: {
              background: "#09090b",
              primary: "#f59e0b",
            },
          });
          isLoadedRef.current = true;
        } catch (err) {
          console.error("Jupiter init error:", err);
        }
      }
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = () => setTimeout(initTerminal, 150);
      document.body.appendChild(script);
    } else {
      setTimeout(initTerminal, 150);
    }
  }, [finalMint]);

  return (
    <div
      className={`w-full bg-zinc-950/90 rounded-xl border border-white/10 flex flex-col min-h-[580px] overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
          ⚡ JUPITER ROUTE: ${finalSymbol}
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">Non-Custodial DEX</span>
      </div>
      <div className="flex-1 w-full p-2 flex items-center justify-center">
        <div id="integrated-terminal" className="w-full h-full min-h-[520px]" />
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
