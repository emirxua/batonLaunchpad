import React from "react";
import { BurnLevel } from "@/types/coin";
import { BURN_TIERS_CONFIG } from "@/lib/burn-levels";
import { Sparkles, Flame, Shield, Award, Gem } from "lucide-react";

interface TierBadgeProps {
  level: BurnLevel;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ level, className = "" }) => {
  const tier = BURN_TIERS_CONFIG[level] || BURN_TIERS_CONFIG.none;

  const getIcon = () => {
    switch (level) {
      case "diamond":
        return <Gem className="w-3.5 h-3.5 text-acid animate-pulse" />;
      case "gold":
        return <Award className="w-3.5 h-3.5 text-[#ffd700]" />;
      case "silver":
        return <Shield className="w-3.5 h-3.5 text-[#c0c0c0]" />;
      case "bronze":
        return <Flame className="w-3.5 h-3.5 text-[#cd7f32]" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-text-faint" />;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider font-mono ${tier.badgeClass} ${tier.glowClass} ${className}`}
    >
      {getIcon()}
      <span>{tier.label}</span>
    </div>
  );
};
