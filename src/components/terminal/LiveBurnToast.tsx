"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Flame, ExternalLink, X, ArrowUpRight, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const BATON_MINT = process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
const WS_ENDPOINT = "wss://pumpportal.fun/api/data";

export interface LiveOnChainEvent {
  id: string;
  signature: string;
  mint: string;
  symbol: string;
  traderPublicKey: string;
  txType: "buy" | "sell" | "burn";
  tokenAmount: number;
  solAmount: number;
  marketCapSol?: number;
  timestamp: number;
}

export function LiveBurnToast() {
  const { connection } = useConnection();
  const [events, setEvents] = useState<LiveOnChainEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addEvent = useCallback((newEvent: LiveOnChainEvent) => {
    setEvents((prev) => {
      // Prevent duplicate signatures
      if (prev.some((e) => e.signature === newEvent.signature)) return prev;
      return [newEvent, ...prev.slice(0, 2)];
    });

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeEvent(newEvent.id);
    }, 6000);
  }, [removeEvent]);

  // ── 1. Solana Web3 connection.onLogs On-Chain Listener ───────────────────
  useEffect(() => {
    if (!connection) return;
    let subId: number | null = null;

    try {
      const mintPk = new PublicKey(BATON_MINT);
      subId = connection.onLogs(
        mintPk,
        (logs) => {
          if (logs.err) return;
          const sig = logs.signature;
          if (!sig) return;

          // Check if log contains burn / transfer
          const logStr = logs.logs.join(" ");
          const isBurn = /burn|BurnChecked|TransferChecked/i.test(logStr);

          if (isBurn) {
            addEvent({
              id: `${sig}-${Date.now()}`,
              signature: sig,
              mint: BATON_MINT,
              symbol: "BATON",
              traderPublicKey: "On-Chain Actor",
              txType: "burn",
              tokenAmount: 0,
              solAmount: 0,
              timestamp: Date.now(),
            });
          }
        },
        "confirmed"
      );
    } catch {
      // Ignore if RPC does not support WebSocket onLogs
    }

    return () => {
      if (subId !== null && connection) {
        connection.removeOnLogsListener(subId).catch(() => {});
      }
    };
  }, [connection, addEvent]);

  // ── 2. PumpPortal Trade/Burn WebSocket Stream ────────────────────────────
  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        const ws = new WebSocket(WS_ENDPOINT);
        wsRef.current = ws;

        ws.onopen = () => {
          // Subscribe specifically to on-chain trades & burns for the tracked mint
          ws.send(
            JSON.stringify({
              method: "subscribeTokenTrade",
              keys: [BATON_MINT],
            })
          );
        };

        ws.onmessage = (message) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(message.data);

            // Only process genuine on-chain trade / burn events with a transaction signature
            if (data && data.signature && (data.txType === "buy" || data.txType === "sell" || data.txType === "burn")) {
              const event: LiveOnChainEvent = {
                id: `${data.signature}-${Date.now()}`,
                signature: data.signature,
                mint: data.mint || BATON_MINT,
                symbol: data.symbol || "BATON",
                traderPublicKey: data.traderPublicKey || data.user || "Unknown",
                txType: data.txType,
                tokenAmount: Number(data.tokenAmount || data.vTokens || 0),
                solAmount: Number(data.solAmount || data.vSol || 0),
                marketCapSol: Number(data.marketCapSol || 0),
                timestamp: Date.now(),
              };

              addEvent(event);
            }
          } catch {
            // Ignore malformed WS frames
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
          }
        };
      } catch {
        if (!isUnmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [addEvent]);

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-mono">
      {events.map((evt) => {
        const isBuy = evt.txType === "buy";
        const shortTrader = `${evt.traderPublicKey.slice(0, 4)}…${evt.traderPublicKey.slice(-4)}`;
        const shortSig = `${evt.signature.slice(0, 6)}…${evt.signature.slice(-4)}`;

        return (
          <div
            key={evt.id}
            className="pointer-events-auto p-3.5 rounded-2xl bg-white/95 dark:bg-[#0D0E12]/95 backdrop-blur-md border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)] flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 fade-in duration-300"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isBuy
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-orange-500/15 border-orange-500/30 text-orange-400"
              }`}
            >
              {isBuy ? <TrendingUp className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black uppercase tracking-wide text-zinc-950 dark:text-white flex items-center gap-1.5">
                  <span className={isBuy ? "text-emerald-400" : "text-orange-400"}>
                    {evt.txType.toUpperCase()}
                  </span>
                  <span>${evt.symbol}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(evt.id)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                <span className="font-bold text-zinc-900 dark:text-white">{shortTrader}</span> swapped{" "}
                <span className="font-bold text-amber-400">{evt.solAmount.toFixed(3)} SOL</span> for{" "}
                <span className="font-bold text-emerald-400">
                  {formatNumber(evt.tokenAmount)} ${evt.symbol}
                </span>
              </p>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                <span>Real-time On-Chain Tx</span>
                <a
                  href={`https://solscan.io/tx/${evt.signature}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <span>{shortSig}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LiveBurnToast;
