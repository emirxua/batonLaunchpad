"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  className = "",
  iconOnly = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`relative inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-raised/90 border border-line text-text-dim hover:text-acid hover:border-acid/40 transition-all active:scale-95 text-[11px] font-mono select-none ${className}`}
      title="Copy CA to clipboard"
    >
      {copied ? (
        <Check className="w-3 h-3 text-up" />
      ) : (
        <Copy className="w-3 h-3" />
      )}

      {!iconOnly && (
        <span>{label || (copied ? "Copied! ✓" : "Copy CA")}</span>
      )}

      {/* Floating Tooltip */}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-acid text-bg text-[10px] font-mono font-black uppercase shadow-lg pointer-events-none animate-in fade-in zoom-in-90 duration-150 whitespace-nowrap z-30">
          Copied! ✓
        </span>
      )}
    </button>
  );
};
