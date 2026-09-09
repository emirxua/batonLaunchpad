/**
 * Netlify Function: scanner-proxy
 * 
 * CORS proxy for scanner page API calls.
 * Handles both pump.fun and DexScreener requests server-side.
 * 
 * Usage:
 *   GET /.netlify/functions/scanner-proxy?source=pumpfun
 *   GET /.netlify/functions/scanner-proxy?source=dexboosts
 *   GET /.netlify/functions/scanner-proxy?source=dexpairs&addresses=addr1,addr2,...
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SOURCES = {
  pumpfun: 'https://frontend-api.pump.fun/coins/latest?limit=24&sort=market_cap&order=DESC&includeNsfw=false',
  dexboosts: 'https://api.dexscreener.com/token-boosts/top/v1',
};

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const source = event.queryStringParameters?.source;
  const addresses = event.queryStringParameters?.addresses;

  let targetUrl;

  if (source === 'dexpairs' && addresses) {
    // Batch pair lookup by token addresses
    targetUrl = `https://api.dexscreener.com/latest/dex/tokens/${addresses}`;
  } else if (SOURCES[source]) {
    targetUrl = SOURCES[source];
  } else {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid source parameter' }),
    };
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlowerOSScanner/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`);
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
