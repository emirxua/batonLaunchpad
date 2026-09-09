/**
 * Vercel Serverless Function: /api/callouts
 * Proxies live Pump.fun Alpha Callouts with CORS support.
 */

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const upstream = await fetch(`https://www.outbid.bond/api/callouts?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

    if (upstream.ok) {
      const data = await upstream.json();
      return res.status(200).json(data);
    }

    // Fallback URL
    const fallback = await fetch(`https://outbid.bond/api/callouts?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

    if (fallback.ok) {
      const data = await fallback.json();
      return res.status(200).json(data);
    }

    return res.status(502).json({ success: false, callouts: [], error: 'Upstream unavailable' });
  } catch (err) {
    return res.status(500).json({ success: false, callouts: [], error: err.message });
  }
};
