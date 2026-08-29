/**
 * Cloudflare Worker: Pump.fun Callouts Batch Proxy with 90s Edge Cache
 *
 * Deployed at: https://pump-callout-proxy.emir1903topuz106.workers.dev
 *
 * Features:
 * 1. Single Root Call returns all 10 tracked wallets in one payload.
 * 2. Cloudflare Global Edge Cache (caches.default) for 90 seconds.
 * 3. 350ms sequential throttling delay between upstream wallet fetches.
 * 4. Backward-compatible with ?wallet= single queries.
 * 5. Full CORS enabled.
 */

const WATCHLIST = [
  { wallet: "2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f", label: "cupseyyyyy" },
  { wallet: "5YRgrP3mjGzrzirYYN5HAQH19cTYREYwGxW6XRJQUzij", label: "slingoor" },
  { wallet: "FNcrF6nt9BXswJrHom4hNmXCeW9no2C8wKh5UqdP8ueu", label: "archelon" },
  { wallet: "7fEXteaTtmX1uR8fpChEXsevM4icH5vq8LNL9dzDupX2", label: "croakie" },
  { wallet: "BSzpGGB3AMwtW126RT3Z27STSBrVjKV5A96H4BsUKdtD", label: "ferre" },
  { wallet: "5hAgYC8TJCcEZV7LTXAzkTrm7YL29YXyQQJPCNrG84zM", label: "schoen" },
  { wallet: "HmUt3Jn46j7c7ANdURmEyjSRj8i3Em6MhjQUi37PZ219", label: "netvyxe" },
  { wallet: "GV6UUmNxz2RpKxmNAPadYKb7uQpszwqQAu3qLJxVdC52", label: "ansemconzimp" },
  { wallet: "6i2aHtxfqkC2biTo98FSkP59FVHPKFRLZWDbdghN6WKK", label: "sapijiju" },
  { wallet: "6DtEedWf9Wk5hA7Xth82Eq441yf5DA4aGLqaQAVfDokm", label: "alonalon" },
];

const UPSTREAM_BASE = "https://frontend-api-v3.pump.fun";
const CACHE_TTL_SECONDS = 90;
const DELAY_BETWEEN_WALLETS_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Cache-Control",
};

async function fetchWalletCallouts(wallet) {
  const url = `${UPSTREAM_BASE}/callout/list/${wallet}`;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://pump.fun/",
    Origin: "https://pump.fun",
  };

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        wallet,
        ok: false,
        status: res.status,
        callouts: [],
        error: `Pump.fun HTTP ${res.status}: ${text.slice(0, 100)}`,
      };
    }

    const data = await res.json();
    const callouts = Array.isArray(data.callouts)
      ? data.callouts
      : Array.isArray(data)
      ? data
      : [];

    return {
      wallet,
      ok: true,
      status: 200,
      callouts,
    };
  } catch (err) {
    return {
      wallet,
      ok: false,
      status: 500,
      callouts: [],
      error: err.message || "Network fetch error",
    };
  }
}

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const url = new URL(request.url);
    const singleWallet = url.searchParams.get("wallet")?.trim();

    // 2. Check Cloudflare Edge Cache (caches.default)
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      const newHeaders = new Headers(cachedResponse.headers);
      newHeaders.set("CF-Cache-Status", "HIT");
      Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: newHeaders,
      });
    }

    // 3. Handle single wallet query if requested (?wallet=...)
    if (singleWallet) {
      const result = await fetchWalletCallouts(singleWallet);
      const payload = {
        updatedAt: new Date().toISOString(),
        callouts: result.callouts,
        ok: result.ok,
        status: result.status,
      };

      const response = new Response(JSON.stringify(payload), {
        status: result.ok ? 200 : result.status || 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
          "CF-Cache-Status": "MISS",
          ...CORS_HEADERS,
        },
      });

      if (result.ok && ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    }

    // 4. Batch Root Query: Fetch all 10 wallets sequentially with 350ms delay
    const results = [];

    for (let i = 0; i < WATCHLIST.length; i++) {
      const item = WATCHLIST[i];
      const res = await fetchWalletCallouts(item.wallet);
      results.push(res);

      if (i < WATCHLIST.length - 1) {
        await sleep(DELAY_BETWEEN_WALLETS_MS);
      }
    }

    const packagePayload = {
      updatedAt: new Date().toISOString(),
      results,
    };

    const response = new Response(JSON.stringify(packagePayload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
        "CF-Cache-Status": "MISS",
        ...CORS_HEADERS,
      },
    });

    // 5. Store in Cloudflare Edge Cache for 90 seconds
    if (ctx?.waitUntil) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};
