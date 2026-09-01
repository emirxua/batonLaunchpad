"use client";

import React, { useState } from "react";

interface TokenLogoProps {
  src?: string | null;
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TokenLogo({
  src,
  symbol,
  size = "md",
  className = "",
}: TokenLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  const getCleanUrl = (url?: string | null): string | null => {
    if (!url) return null;
    let clean = url.trim();
    if (clean.includes("ipfs.io/ipfs/")) {
      clean = clean.replace("https://ipfs.io/ipfs/", "https://pump.mypinata.cloud/ipfs/");
    }
    return clean;
  };

  const primaryUrl = getCleanUrl(src);

  const mirrors = [
    primaryUrl,
    primaryUrl?.includes("pump.mypinata.cloud/ipfs/")
      ? primaryUrl.replace("pump.mypinata.cloud/ipfs/", "cf-ipfs.com/ipfs/")
      : null,
    primaryUrl?.includes("pump.mypinata.cloud/ipfs/")
      ? primaryUrl.replace("pump.mypinata.cloud/ipfs/", "dweb.link/ipfs/")
      : null,
  ].filter(Boolean) as string[];

  const currentSrc = mirrors[gatewayIndex] || null;

  const handleImageError = () => {
    if (gatewayIndex < mirrors.length - 1) {
      setGatewayIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const sizeClass =
    size === "sm"
      ? "w-6 h-6 rounded-lg text-[9px]"
      : size === "lg"
      ? "w-11 h-11 rounded-2xl text-sm"
      : "w-8 h-8 rounded-xl text-xs";

  const displaySymbol = (symbol || "TOKEN").replace(/^\$/, "").slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizeClass} bg-zinc-800 border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative select-none ${className}`}
    >
      {currentSrc && !hasError ? (
        <img
          src={currentSrc}
          alt={symbol}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover block absolute inset-0 rounded-inherit"
        />
      ) : (
        <span className="font-bold text-amber-400 text-[10px] tracking-tight">
          ${displaySymbol}
        </span>
      )}
    </div>
  );
}

export default TokenLogo;
