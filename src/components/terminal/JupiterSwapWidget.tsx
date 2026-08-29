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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "jup-terminal-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const loadWidget = () => {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { Jupiter?: { init: (props: unknown) => void } }).Jupiter &&
        containerRef.current
      ) {
        // Varsa önceki instance'ı temizle
        containerRef.current.innerHTML = "";

        const rpcEndpoint =
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://rpc.ankr.com/solana";

        (window as unknown as { Jupiter: { init: (props: unknown) => void } }).Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: "integrated-terminal",
          endpoint: rpcEndpoint,
          strictTokenList: false,
          formProps: {
            initialInputMint: "So11111111111111111111111111111111111111112", // SOL
            initialOutputMint: finalMint,
            fixedOutputMint: false,
          },
          palette: {
            background: "#09090b",
            primary: "#f59e0b",
          },
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = loadWidget;
      document.body.appendChild(script);
    } else {
      loadWidget();
    }
  }, [finalMint]);

  return (
    <div
      className={`w-full bg-zinc-950/80 rounded-xl border border-white/10 flex flex-col h-[560px] overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
          ⚡ JUPITER ROUTE: ${finalSymbol}
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">Non-Custodial DEX</span>
      </div>
      <div className="flex-1 w-full relative">
        <div
          id="integrated-terminal"
          ref={containerRef}
          className="w-full h-full min-h-[500px]"
        />
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
