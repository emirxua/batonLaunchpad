"use client";

import React, { useState } from "react";

interface CallerAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CallerAvatar({
  avatarUrl,
  name,
  size = "md",
  className = "",
}: CallerAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  // Normalize image URL & handle IPFS mirrors
  const getCleanUrl = (url?: string | null): string | null => {
    if (!url) return null;
    let clean = url.trim();
    if (clean.includes("ipfs.io/ipfs/")) {
      clean = clean.replace("https://ipfs.io/ipfs/", "https://pump.mypinata.cloud/ipfs/");
    }
    return clean;
  };

  const primaryUrl = getCleanUrl(avatarUrl);

  const gateways = [
    primaryUrl,
    primaryUrl?.includes("pump.mypinata.cloud/ipfs/")
      ? primaryUrl.replace("pump.mypinata.cloud/ipfs/", "cf-ipfs.com/ipfs/")
      : null,
    primaryUrl?.includes("pump.mypinata.cloud/ipfs/")
      ? primaryUrl.replace("pump.mypinata.cloud/ipfs/", "dweb.link/ipfs/")
      : null,
  ].filter(Boolean) as string[];

  const currentSrc = gateways[gatewayIndex] || null;

  const handleImageError = () => {
    if (gatewayIndex < gateways.length - 1) {
      setGatewayIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const sizeClass =
    size === "sm"
      ? "w-7 h-7 rounded-lg text-[10px]"
      : size === "lg"
      ? "w-11 h-11 rounded-2xl text-xs"
      : size === "xl"
      ? "w-14 h-14 rounded-3xl text-sm"
      : "w-10 h-10 rounded-2xl text-xs";

  const initials = (name || "CA").replace(/^@/, "").slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-md relative select-none ${className}`}
    >
      {currentSrc && !hasError ? (
        <img
          src={currentSrc}
          alt={name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover block absolute inset-0"
        />
      ) : (
        <span className="font-black text-amber-400 uppercase tracking-tight">
          {initials}
        </span>
      )}
    </div>
  );
}

export default CallerAvatar;
