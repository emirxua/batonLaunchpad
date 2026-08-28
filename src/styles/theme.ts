export const THEME_COLORS = {
  bg: "#0a0b0d",
  bgRaised: "#131519",
  bgCard: "#17191e",
  line: "#262930",
  text: "#eef0ec",
  textDim: "#8b8f99",
  textFaint: "#55585f",
  acid: "#d4ff3f",
  acidDim: "#a8cc32",
  magenta: "#ff3d7a",
  magentaDim: "#c22d5c",
  up: "#4ade80",
  down: "#ff5c5c",
} as const;

export const BURN_TIERS = {
  none: { label: "Standard", minBurn: 0, color: "#8b8f99", badge: "border-line text-text-dim" },
  bronze: { label: "Bronze", minBurn: 10_000, color: "#cd7f32", badge: "border-[#cd7f32]/40 bg-[#cd7f32]/10 text-[#e6a86c]" },
  silver: { label: "Silver", minBurn: 50_000, color: "#c0c0c0", badge: "border-[#c0c0c0]/40 bg-[#c0c0c0]/10 text-[#f0f0f0]" },
  gold: { label: "Gold", minBurn: 250_000, color: "#ffd700", badge: "border-[#ffd700]/40 bg-[#ffd700]/10 text-[#ffe033]" },
  diamond: { label: "Diamond", minBurn: 1_000_000, color: "#70d6ff", badge: "border-[#70d6ff]/40 bg-[#70d6ff]/10 text-[#a5e5ff] shadow-[0_0_15px_rgba(112,214,255,0.25)]" },
} as const;
