/**
 * Vercel Serverless Function: /api/trending
 * Returns live trending Solana trenches from DexScreener & curated feeds (Zero Baton).
 */

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const MIS_CA = 'AWQSXRxiNUGLj9moJMFhq2axqwu6Dqerp16ftj4FjLyG';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let coins = [];

    // 1. Fetch live curated coins
    try {
      const resp = await fetch('https://www.outbid.bond/api/coins', {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      if (resp.ok) {
        const json = await resp.json();
        coins = json.data || (Array.isArray(json) ? json : []);
      }
    } catch {}

    // 2. Fetch top boosts on Solana from DexScreener
    let dexCoins = [];
    try {
      const boostsRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      if (boostsRes.ok) {
        const boosts = await boostsRes.json();
        const solMints = boosts
          .filter(b => b.chainId === 'solana' && b.tokenAddress)
          .map(b => b.tokenAddress)
          .slice(0, 10);

        if (solMints.length > 0) {
          const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${solMints.join(',')}`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
          });
          if (pairsRes.ok) {
            const pairsData = await pairsRes.json();
            const seen = new Set();
            (pairsData.pairs || []).forEach(p => {
              const addr = p.baseToken?.address;
              if (addr && !seen.has(addr)) {
                seen.add(addr);
                dexCoins.push({
                  id: `dex-${addr.slice(0, 8)}`,
                  name: p.baseToken.name || 'Solana Token',
                  ticker: p.baseToken.symbol || 'SOL',
                  mintAddress: addr,
                  imageUrl: p.info?.imageUrl || '',
                  priceUsd: parseFloat(p.priceUsd || 0),
                  marketCap: parseFloat(p.marketCap || p.fdv || 0),
                  volume24h: parseFloat(p.volume?.h24 || 0),
                  change24h: parseFloat(p.priceChange?.h24 || 0),
                  pairAddress: p.pairAddress || '',
                  liquidityUsd: parseFloat(p.liquidity?.usd || 0),
                  dexScreenerUrl: p.url || `https://dexscreener.com/solana/${addr}`,
                });
              }
            });
          }
        }
      }
    } catch {}

    // Merge and deduplicate
    const all = [];
    const seenMints = new Set();

    [...coins, ...dexCoins].forEach(c => {
      const mint = c.mintAddress || '';
      if (mint && !seenMints.has(mint)) {
        seenMints.add(mint);
        all.push(c);
      }
    });

    return res.status(200).json({
      success: true,
      count: all.length,
      data: all,
      timestamp: Date.now(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, count: 0, data: [], error: err.message });
  }
};
