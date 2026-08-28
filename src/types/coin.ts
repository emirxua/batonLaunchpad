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
  priceUsd?: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  sparkline: number[];
  totalBurnedBaton: number;
  burnLevel: BurnLevel;
  pairAddress?: string;
}
