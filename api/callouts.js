/**
 * Vercel Serverless Function: /api/callouts
 * Fetches real live Solana Alpha Callouts directly from Pump.fun API feeds.
 */

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function sanitizeIpfs(url) {
  if (!url) return null;
  if (url.includes('ipfs.io/ipfs/')) {
    return url.replace('https://ipfs.io/ipfs/', 'https://cf-ipfs.com/ipfs/');
  }
  return url;
}

function isSolanaAddress(addr) {
  if (!addr) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(addr).trim());
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const feedRes = await fetch('https://frontend-api-v3.pump.fun/home-feed?pageSize=100&chain=solana', {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://pump.fun/',
        'Origin': 'https://pump.fun',
        'Cache-Control': 'no-cache'
      }
    });

    if (!feedRes.ok) {
      throw new Error(`Pump feed returned status ${feedRes.status}`);
    }

    const data = await feedRes.json();
    const coins = Array.isArray(data?.coins) ? data.coins : [];
    const callouts = [];
    const seen = new Set();

    for (const item of coins) {
      if (!item || !item.coinMint || !isSolanaAddress(item.coinMint)) continue;

      const pos = item.position || {};
      const c = pos.callout || {};

      // Unique deduplication per mint + callout
      const cid = c.calloutId || (item.coinMint + '_' + (pos.walletAddress || item.symbol));
      if (seen.has(cid)) continue;
      seen.add(cid);

      const callerWallet = pos.walletAddress || pos.userId || '';
      const callerX = pos.xUsername || null;
      const callerName = pos.userName || (callerX ? '@' + callerX : (callerWallet ? callerWallet.slice(0, 4) + '...' + callerWallet.slice(-4) : 'Alpha Caller'));
      const callerAvatar = sanitizeIpfs(pos.xProfileImage || pos.profileImage);

      const entryMcap = Number(c.calledOutAtMcap || item.marketCap || 15000);
      const currMcap = Number(item.marketCap || entryMcap || 15000);
      const mult = Number(c.multiple || (entryMcap > 0 && currMcap > 0 ? currMcap / entryMcap : 1));

      const createdAt = c.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : Date.now();

      callouts.push({
        calloutId: cid,
        coinMint: item.coinMint,
        coinSymbol: item.symbol || 'TOKEN',
        coinName: item.coinName || item.symbol || 'Solana Token',
        mediaUrl: sanitizeIpfs(item.coinImage),
        callerLabel: callerName,
        callerXUsername: callerX,
        callerWallet: callerWallet,
        callerAvatarUrl: callerAvatar,
        calledOutAtMcap: entryMcap,
        currentMcap: currMcap,
        multiplier: mult,
        multiple: mult,
        thesis: c.thesis || null,
        createdAt: createdAt
      });
    }

    return res.status(200).json({
      success: true,
      count: callouts.length,
      callouts: callouts
    });
  } catch (err) {
    console.error('Callouts API error:', err.message);
    return res.status(500).json({
      success: false,
      callouts: [],
      error: err.message
    });
  }
};
