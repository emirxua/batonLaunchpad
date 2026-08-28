export type BurnLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Coin {
  id: string;
  name: string;
  ticker: string;
  mintAddress: string;
  iconUrl?: string;
  imageUrl?: string;
  headerUrl?: string;
  iconColor: string;
  category?: string;
  description?: string;
  website?: string;
  twitter?: string;
  viewsCount?: number;
  priceUsd?: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  sparkline: number[];
  totalBurnedBaton: number;
  burnLevel: BurnLevel;
  pairAddress?: string;
}
