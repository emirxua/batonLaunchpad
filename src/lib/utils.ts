import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatCryptoPrice(price: number | undefined | null): string {
  if (typeof price !== "number" || isNaN(price) || price <= 0) return "$0.00";
  if (price < 0.0001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.floor(Math.max(0, value || 0))
  );
}

export function formatTimeAgo(timestamp: number | string | Date | undefined | null): string {
  if (!timestamp) return "Live";

  let ms: number;
  if (typeof timestamp === "number") {
    ms = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  } else if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    ms = !isNaN(parsed) ? parsed : Number(timestamp);
    if (ms < 1_000_000_000_000) ms *= 1000;
  } else if (timestamp instanceof Date) {
    ms = timestamp.getTime();
  } else {
    return "Live";
  }

  if (isNaN(ms) || ms <= 0) return "Live";

  const diffMs = Math.max(0, Date.now() - ms);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
