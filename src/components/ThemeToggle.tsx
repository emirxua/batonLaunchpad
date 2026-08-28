"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-line bg-bg-raised" />
    );
  }

  const isDark = theme === "dark" || resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 rounded-xl border border-line bg-bg-raised text-text-dim hover:text-text hover:border-acid/40 transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center group"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-text-dim group-hover:text-[#ffd700] transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-text-dim group-hover:text-magenta transition-colors" />
      )}
    </button>
  );
};
