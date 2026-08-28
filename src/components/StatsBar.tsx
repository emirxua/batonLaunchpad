import React from "react";
import { Flame, Rocket, Activity, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StatsBarProps {
  totalBurned?: number;
  listedCoins?: number;
  topMultiplier?: string;
  tps?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalBurned = 0,
  listedCoins = 1,
  topMultiplier = "Diamond 10x",
  tps = 2840,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-raised/70 backdrop-blur-md shadow-lg shadow-zinc-200/40 dark:shadow-none font-mono">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-magenta/10 border border-rose-200 dark:border-magenta/20 text-rose-500 dark:text-magenta">
          <Flame className="w-5 h-5 fill-rose-500/20 dark:fill-magenta/20" />
        </div>
        <div>
          <div className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold tracking-wider">
            Total Burned $BATON
          </div>
          <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-text font-mono-num">
            {formatNumber(totalBurned)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-acid/10 border border-emerald-200 dark:border-acid/20 text-emerald-600 dark:text-acid">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold tracking-wider">
            Active Mascots
          </div>
          <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-text font-mono-num">
            {listedCoins} Projects
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-[#70d6ff]/10 border border-sky-200 dark:border-[#70d6ff]/20 text-sky-600 dark:text-[#70d6ff]">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold tracking-wider">
            Max Tier Boost
          </div>
          <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-text font-mono-num">
            {topMultiplier}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-up/10 border border-emerald-200 dark:border-up/20 text-emerald-600 dark:text-up">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold tracking-wider">
            Solana Live TPS
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-up font-mono-num flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 dark:bg-up animate-ping" />
            {formatNumber(tps)}
          </div>
        </div>
      </div>
    </div>
  );
};
