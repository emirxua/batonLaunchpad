import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-raised": "var(--bg-raised)",
        "bg-card": "var(--bg-card)",
        line: "var(--line)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        "solana-green": "#14F195",
        "solana-purple": "#9945FF",
        "terminal-dark": "#0B0E14",
        "terminal-card": "#0D1117",
        "terminal-border": "#1E2638",
        acid: "#F59E0B",
        "acid-dim": "#D97706",
        magenta: "#F43F5E",
        "magenta-dim": "#E11D48",
        up: "#14F195",
        down: "#F43F5E",
      },
      fontFamily: {
        archivo: ["var(--font-archivo)", "sans-serif"],
        space: ["var(--font-space)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
