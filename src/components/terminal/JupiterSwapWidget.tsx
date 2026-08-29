"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

export function JupiterSwapWidget({
  outputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const [, setLoaded] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const walletContext = useWallet();

  useEffect(() => {
    let isMounted = true;
    let script = document.getElementById("jupiter-terminal-script") as HTMLScriptElement | null;

    const renderJupiter = () => {
      if (
        (window as unknown as { Jupiter?: { init: (c: unknown) => void } })
          .Jupiter &&
        isMounted
      ) {
        try {
          const container = document.getElementById("integrated-terminal");
          if (container) {
            container.innerHTML = "";
          }
          (
            window as unknown as { Jupiter: { init: (c: unknown) => void } }
          ).Jupiter.init({
            displayMode: "integrated",
            integratedTargetId: "integrated-terminal",
            strictTokenList: false,
            defaultExplorer: "Solscan",
            enableWalletPassthrough: true,
            passthroughWalletContextState: walletContext,
            formProps: {
              initialInputMint: "So11111111111111111111111111111111111111112", // Native SOL
              initialOutputMint: outputMint,
              initialAmount: "0.1",
              fixedOutputMint: false,
            },
            palette: {
              background: "#09090b",
              primary: "#f59e0b",
            },
          });
          if (isMounted) setLoaded(true);
        } catch (err) {
          console.error("Jupiter init error:", err);
          if (isMounted) setUseIframeFallback(true);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = "jupiter-terminal-script";
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = () => {
        if (isMounted) setTimeout(renderJupiter, 200);
      };
      script.onerror = () => {
        if (isMounted) setUseIframeFallback(true);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(renderJupiter, 200);
    }

    // 2.5s fallback safety
    const timer = setTimeout(() => {
      const container = document.getElementById("integrated-terminal");
      if (isMounted && container && container.children.length === 0) {
        setUseIframeFallback(true);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [outputMint, walletContext]);

  // Cüzdan senkronizasyonu
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { Jupiter?: { syncProps?: (p: unknown) => void } })
        .Jupiter?.syncProps
    ) {
      (
        window as unknown as { Jupiter: { syncProps: (p: unknown) => void } }
      ).Jupiter.syncProps({
        passthroughWalletContextState: walletContext,
      });
    }
  }, [walletContext]);

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col overflow-hidden font-mono">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
        <span className="text-xs font-bold text-amber-400">
          JUPITER ROUTE: ${outputSymbol}
        </span>
        <span className="text-[10px] text-zinc-400">Non-Custodial DEX</span>
      </div>

      {/* Terminal Gövdesi */}
      <div className="w-full p-2 flex flex-col items-center justify-start min-h-[420px] relative">
        {useIframeFallback ? (
          <iframe
            src={`https://jup.ag/swap/SOL-${outputMint}?theme=dark`}
            className="w-full h-[400px] border-0 rounded-lg min-h-[400px]"
            title="Jupiter Swap"
            allow="clipboard-write"
          />
        ) : (
          <div
            id="integrated-terminal"
            className="w-full h-full min-h-[400px] flex justify-center items-start"
          />
        )}
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
