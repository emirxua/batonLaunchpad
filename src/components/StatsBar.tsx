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
  totalBurned = 48_290_420,
  listedCoins = 142,
  topMultiplier = "Diamond 10x",
  tps = 2840,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border border-line bg-bg-raised/70 backdrop-blur font-mono">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-magenta/10 border border-magenta/20 text-magenta">
          <Flame className="w-5 h-5 fill-magenta/20" />
        </div>
        <div>
          <div className="text-[11px] text-text-faint uppercase font-bold tracking-wider">
            Total Burned $BATON
          </div>
          <div className="text-lg font-bold text-text font-mono-num">
            {formatNumber(totalBurned)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-acid/10 border border-acid/20 text-acid">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-text-faint uppercase font-bold tracking-wider">
            Active Mascots
          </div>
          <div className="text-lg font-bold text-text font-mono-num">
            {listedCoins} Projects
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[#70d6ff]/10 border border-[#70d6ff]/20 text-[#70d6ff]">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-text-faint uppercase font-bold tracking-wider">
            Max Tier Boost
          </div>
          <div className="text-lg font-bold text-text font-mono-num">
            {topMultiplier}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-up/10 border border-up/20 text-up">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] text-text-faint uppercase font-bold tracking-wider">
            Solana Live TPS
          </div>
          <div className="text-lg font-bold text-up font-mono-num flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-up animate-ping" />
            {formatNumber(tps)}
          </div>
        </div>
      </div>
    </div>
  );
};
