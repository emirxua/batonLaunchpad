const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 1. Fetch live tokens from outbid API
    let coins = [];
    try {
      const res = await fetch('https://www.outbid.bond/api/coins', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const d = await res.json();
        coins = d.data || [];
      }
    } catch (e) {
      console.warn('Coins fetch failed:', e);
    }

    // 2. Fetch top boosts from DexScreener
    let dexCoins = [];
    try {
      const boostsRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
      if (boostsRes.ok) {
        const boosts = await boostsRes.json();
        const solMints = boosts
          .filter((b) => b.chainId === 'solana' && b.tokenAddress)
          .map((b) => b.tokenAddress)
          .slice(0, 15);

        if (solMints.length > 0) {
          const pairsRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${solMints.join(',')}`
          );
          if (pairsRes.ok) {
            const pairsData = await pairsRes.json();
            const seen = new Set();
            for (const p of pairsData.pairs || []) {
              const addr = p.baseToken?.address;
              if (addr && !seen.has(addr)) {
                seen.add(addr);
                dexCoins.push({
                  id: `dex-${addr.slice(0, 8)}`,
                  name: p.baseToken?.name || 'Solana Token',
                  ticker: p.baseToken?.symbol || 'SOL',
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
            }
          }
        }
      }
    } catch (e) {
      console.warn('DexScreener boosts fetch failed:', e);
    }

    // Deduplicate
    const all = [];
    const seen = new Set();

    for (const c of [...coins, ...dexCoins]) {
      const m = c.mintAddress;
      if (m && !seen.has(m)) {
        seen.add(m);
        all.push(c);
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...CORS,
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
      },
      body: JSON.stringify({
        success: true,
        count: all.length,
        data: all,
        timestamp: Date.now(),
      }),
    };
  } catch (err) {
    console.error('Trending handler error:', err);
    // User rule: NEVER USE MOCK DATA
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ success: false, count: 0, data: [], error: err.message }),
    };
  }
};
