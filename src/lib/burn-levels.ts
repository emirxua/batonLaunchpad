import { BurnLevel } from "@/types/coin";

export interface BurnTierConfig {
  level: BurnLevel;
  label: string;
  badgeText: string;
  minBurn: number;
  color: string;
  badgeClass: string;
  glowClass: string;
}

export const BURN_TIERS_CONFIG: Record<BurnLevel, BurnTierConfig> = {
  none: {
    level: "none",
    label: "Standard",
    badgeText: "NO BADGE",
    minBurn: 0,
    color: "#55585f",
    badgeClass: "border-line text-text-faint bg-bg-raised",
    glowClass: "",
  },
  bronze: {
    level: "bronze",
    label: "Bronze",
    badgeText: "✦ BRONZE",
    minBurn: 10_000,
    color: "#cd7f32",
    badgeClass: "border-[#cd7f32]/50 bg-[#cd7f32]/10 text-[#e6a86c]",
    glowClass: "shadow-[0_0_10px_rgba(205,127,50,0.2)]",
  },
  silver: {
    level: "silver",
    label: "Silver",
    badgeText: "✦ SILVER",
    minBurn: 50_000,
    color: "#c0c0c0",
    badgeClass: "border-[#c0c0c0]/50 bg-[#c0c0c0]/10 text-[#f0f0f0]",
    glowClass: "shadow-[0_0_10px_rgba(192,192,192,0.2)]",
  },
  gold: {
    level: "gold",
    label: "Gold",
    badgeText: "✦ GOLD",
    minBurn: 250_000,
    color: "#ffd700",
    badgeClass: "border-[#ffd700]/50 bg-[#ffd700]/10 text-[#ffe033]",
    glowClass: "shadow-[0_0_12px_rgba(255,215,0,0.25)]",
  },
  diamond: {
    level: "diamond",
    label: "Diamond",
    badgeText: "✦ DIAMOND",
    minBurn: 1_000_000,
    color: "#d4ff3f",
    badgeClass: "border-acid bg-acid/15 text-acid font-black",
    glowClass: "shadow-[0_0_16px_rgba(212,255,63,0.35)]",
  },
};

export function getBurnLevel(totalBurnedBaton: number): BurnLevel {
  if (totalBurnedBaton >= 1_000_000) return "diamond";
  if (totalBurnedBaton >= 250_000) return "gold";
  if (totalBurnedBaton >= 50_000) return "silver";
  if (totalBurnedBaton >= 10_000) return "bronze";
  return "none";
}

export function getBurnTierInfo(totalBurnedBaton: number): BurnTierConfig {
  const level = getBurnLevel(totalBurnedBaton);
  return BURN_TIERS_CONFIG[level];
}
