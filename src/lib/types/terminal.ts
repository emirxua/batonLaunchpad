/**
 * TypeScript Type Definitions for /terminal and Real-Time Market Modules.
 * Compatible with real Binance and DexScreener API responses.
 */

export interface BinanceMarketData {
  symbol: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  /** Last 24 hours closing prices for mini-chart/sparkline */
  sparkline: number[];
}

export interface DexTrendingToken {
  mint: string;
  name: string;
  symbol: string;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUsd: number;
  pairAddress: string;
  iconUrl: string | null;
}

export type TerminalActiveTab = "all" | "gainers" | "volume";

export interface TerminalState {
  selectedTokenMint: string;
  selectedTokenSymbol: string;
  activeTab: TerminalActiveTab;
  minMcapFilter: number;
}
