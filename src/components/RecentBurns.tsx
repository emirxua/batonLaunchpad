"use client";

import React, { useState } from "react";
import { RecordedBurn } from "@/app/api/burns/route";
import { formatNumber } from "@/lib/utils";
import { Flame, ExternalLink, Copy, Check, ShieldCheck, Clock, ArrowUpRight } from "lucide-react";

interface RecentBurnsProps {
  burns: RecordedBurn[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const RecentBurns: React.FC<RecentBurnsProps> = ({
  burns = [],
  isLoading = false,
}) => {
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <section className="rounded-3xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-card p-6 sm:p-8 space-y-5 shadow-xl shadow-zinc-200/30 dark:shadow-none relative overflow-hidden content-auto font-mono">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="font-archivo text-base sm:text-lg text-zinc-900 dark:text-white uppercase tracking-wide font-black">
              Recent Burns
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Verified SPL token burn transactions confirmed on Solana
            </p>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Solscan Verified Logs
        </div>
      </div>

      {/* Burns Table / List */}
      {burns.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-bg-raised text-zinc-500 dark:text-zinc-400 dark:text-text-faint flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-archivo text-base text-zinc-900 dark:text-text uppercase">
              No On-Chain Burns Recorded Yet
            </h4>
            <p className="text-xs text-zinc-500 dark:text-text-dim max-w-sm mx-auto font-space">
              Connect your Solana wallet and click <strong>&quot;Burn &amp; Boost&quot;</strong> to execute the first verified burn transaction!
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-500 dark:text-zinc-400 dark:text-text-faint uppercase text-[11px] border-b border-zinc-200/80 dark:border-line/60">
                <th className="py-3 px-3">Burner Wallet</th>
                <th className="py-3 px-3">Mascot / Project</th>
                <th className="py-3 px-3 text-right">Burned Amount</th>
                <th className="py-3 px-3 text-center">Time</th>
                <th className="py-3 px-3 text-right">Solscan Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-line/40">
              {burns.map((burn) => {
                const shortUser =
                  burn.userAddress && burn.userAddress.length > 8
                    ? `${burn.userAddress.slice(0, 4)}...${burn.userAddress.slice(-4)}`
                    : burn.userAddress || "Anonymous";
                const shortTx =
                  burn.txHash && burn.txHash.length > 12
                    ? `${burn.txHash.slice(0, 6)}...${burn.txHash.slice(-6)}`
                    : burn.txHash;
                const isCopied = copiedTx === burn.txHash;

                return (
                  <tr
                    key={burn.id}
                    className="hover:bg-zinc-50 dark:hover:bg-bg-raised/50 transition-colors group"
                  >
                    {/* User Address */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800 dark:text-text">
                          {shortUser}
                        </span>
                      </div>
                    </td>

                    {/* Target Coin */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-bg-raised border border-zinc-200/80 dark:border-line text-zinc-700 dark:text-text-dim text-[11px] font-bold">
                        {burn.coinName || "Baton"} (${burn.coinTicker || "BATON"})
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-rose-600 dark:text-magenta">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-mono-num font-black">
                          {formatNumber(burn.amount)}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-text-dim uppercase">
                          $BATON
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-3 text-center text-zinc-500 dark:text-text-faint text-[11px]">
                      {formatTimeAgo(burn.timestamp)}
                    </td>

                    {/* Solscan Link */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(burn.txHash)}
                          className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-acid transition-colors"
                          title="Copy Full TX Hash"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        <a
                          href={`https://solscan.io/tx/${burn.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 dark:bg-bg-raised text-zinc-950 dark:text-white dark:text-acid border border-zinc-900 dark:border-acid/30 hover:bg-emerald-600 dark:hover:bg-acid dark:hover:text-bg text-[11px] font-bold transition-all shadow-sm"
                        >
                          <span>{shortTx}</span>
                          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 dark:text-text-faint border-t border-zinc-200/60 dark:border-line/50">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-acid" />
          <span>Every transaction burns real SPL tokens directly from user wallets.</span>
        </div>
        <span className="font-bold text-zinc-700 dark:text-text-dim">
          Total Recorded Burns: {burns.length}
        </span>
      </div>
    </section>
  );
};
