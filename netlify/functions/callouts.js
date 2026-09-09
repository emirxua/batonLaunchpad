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
    const res = await fetch('https://www.outbid.bond/api/callouts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
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
        ...CORS,
        'Cache-Control': 'public, max-age=3, stale-while-revalidate=5',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Callouts function error:', err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ success: false, callouts: [], error: err.message }),
    };
  }
};
