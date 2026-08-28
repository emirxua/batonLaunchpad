"use client";

import React, { useState } from "react";
import { TopHolder } from "@/app/api/token-stats/route";
import { formatNumber } from "@/lib/utils";
import {
  Users,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Landmark,
} from "lucide-react";

interface TopHoldersProps {
  holders?: TopHolder[];
  totalHoldersCount?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export const TopHolders: React.FC<TopHoldersProps> = React.memo(({
  holders = [],
  totalHoldersCount = 0,
  isLoading = false,
  onRefresh,
  lastUpdated,
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <section className="rounded-3xl border border-line bg-bg-card p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden content-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-acid/10 border border-acid/30 text-acid flex items-center justify-center shadow-[0_0_15px_rgba(212,255,63,0.15)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-archivo text-lg sm:text-xl text-text uppercase tracking-wide">
                Top Holders <span className="text-acid">&amp; Distribution</span>
              </h3>
              <span className="text-[10px] font-mono text-acid bg-acid/10 border border-acid/30 px-2 py-0.5 rounded uppercase font-bold">
                On-Chain Verified
              </span>
            </div>
            <p className="font-mono text-xs text-text-dim">
              Largest $BATON token wallets and liquidity accounts
            </p>
          </div>
        </div>

        {/* Status & Refresh */}
        <div className="flex items-center gap-3">
          {/* Live Sync Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-up/10 border border-up/30 text-up font-mono text-[11px] font-bold select-none">
            <span className="w-2 h-2 rounded-full bg-up animate-ping" />
            <span>Live · 15s sync</span>
          </div>

          <div className="font-mono text-xs text-text-faint hidden sm:block">
            {formatNumber(totalHoldersCount)} Holders
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl border border-line text-text-dim hover:text-acid hover:border-acid/40 transition-colors"
              title="Refresh On-Chain Holders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-acid" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="text-text-faint uppercase text-[11px] border-b border-line/60">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Account / Owner</th>
              <th className="py-3 px-3">Tag</th>
              <th className="py-3 px-3 text-right">Holdings ($BATON)</th>
              <th className="py-3 px-3 text-right">Supply Share</th>
              <th className="py-3 px-3 text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {isLoading && holders.length === 0 ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="animate-pulse">
                  <td className="py-3.5 px-3"><div className="h-4 w-6 rounded bg-bg-raised" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 w-28 rounded bg-bg-raised" /></td>
                  <td className="py-3.5 px-3"><div className="h-4 w-20 rounded bg-bg-raised" /></td>
                  <td className="py-3.5 px-3 text-right"><div className="h-4 w-24 ml-auto rounded bg-bg-raised" /></td>
                  <td className="py-3.5 px-3 text-right"><div className="h-4 w-16 ml-auto rounded bg-bg-raised" /></td>
                  <td className="py-3.5 px-3 text-right"><div className="h-6 w-6 ml-auto rounded bg-bg-raised" /></td>
                </tr>
              ))
            ) : (
              holders.map((holder) => {
                const displayAddress = holder.owner || holder.address;
                const shortAddr = `${displayAddress.slice(0, 4)}...${displayAddress.slice(-4)}`;
                const isCopied = copiedAddress === displayAddress;

                let rankColor = "text-text-dim";
                if (holder.rank === 1) rankColor = "text-[#ffd700] font-black";
                if (holder.rank === 2) rankColor = "text-[#c0c0c0] font-black";
                if (holder.rank === 3) rankColor = "text-[#cd7f32] font-black";

                return (
                  <tr
                    key={holder.address}
                    className="hover:bg-bg-raised/50 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3">
                      <span className={`text-xs font-bold ${rankColor}`}>
                        {holder.rank < 10 ? `0${holder.rank}` : holder.rank}
                      </span>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-text font-bold tracking-wider">
                          {shortAddr}
                        </span>
                        <button
                          onClick={() => handleCopy(displayAddress)}
                          className="text-text-faint hover:text-acid transition-colors p-1"
                          title="Copy Address"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-up" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Label / Tag */}
                    <td className="py-3.5 px-3">
                      {holder.isPool ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-magenta/10 border border-magenta/30 text-magenta text-[10px] font-bold uppercase">
                          <Landmark className="w-2.5 h-2.5" />
                          <span>Raydium / Pool</span>
                        </span>
                      ) : holder.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-acid/10 border border-acid/30 text-acid text-[10px] font-bold uppercase">
                          <span>Whale #1</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-faint">Holder</span>
                      )}
                    </td>

                    {/* Holdings */}
                    <td className="py-3.5 px-3 text-right font-mono-num font-bold text-text">
                      {formatNumber(Math.round(holder.amount))}
                    </td>

                    {/* Percentage with mini bar */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-bg border border-line/60 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              holder.isPool ? "bg-magenta" : "bg-acid"
                            }`}
                            style={{
                              width: `${Math.min(100, holder.percentage * 2)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold font-mono-num ${
                            holder.isPool ? "text-magenta" : "text-acid"
                          }`}
                        >
                          {holder.percentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    {/* Solscan Link */}
                    <td className="py-3.5 px-3 text-right">
                      <a
                        href={`https://solscan.io/account/${displayAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-bg-raised border border-line text-text-dim hover:text-text hover:border-text-dim transition-colors"
                        title="View Account on Solscan"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer link to Solscan */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-text-faint border-t border-line/50">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-acid" />
          <span>Total initial supply: 1,000,000,000 $BATON • Deflationary on-chain burning</span>
        </div>

        <a
          href="https://solscan.io/token/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump#holders"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-dim hover:text-acid transition-colors inline-flex items-center gap-1 font-bold"
        >
          <span>View All 1,935+ Holders on Solscan</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
});

TopHolders.displayName = "TopHolders";
