// Cloudflare Worker: Pump.fun Real Callouts & User Callout Proxy
const WATCHLIST = [
  { wallet: "CpqBZF4V98AFGK9yDXFT2AiX7E3BqkJmhrCJnuxCvv46", label: "moonjellyfish33" },
  { wallet: "iPUp3qkm39ycMGbywWFMUyvaDhiiPGXeWXaDtmHNe6C", label: "arcnikolas" },
  { wallet: "5cFZ9qw5kovwJXQQHCVDQWPEQH9e7UXvitq5ET17sZrP", label: "mikael_ch" },
  { wallet: "CE44oKS3wpUerx8afyeii56u5oQjBLZknzm4Q2CYHUz9", label: "ely" },
  { wallet: "57gsfHMx48nMxF5WX5RXTuYWijHZCm34zrCKrSE199hX", label: "Applebottomjean" },
  { wallet: "6qudAN2kV8mtCcYJxb5QQ6Vr15itdHHdeVbYm99NKMhy", label: "thedetective" },
  { wallet: "7YndBV5gp3VvAiBbSfv8M7CoyMhFsiKeGYWkwee49fTg", label: "poe" },
  { wallet: "DB8srMNYiifrgKJyAuDzj8RvNvw8PLKruWcRevGhUQYW", label: "bon_g" },
  { wallet: "G3g1CKqKWSVEVURZDNMazDBv7YAhMNTjhJBVRTiKZygk", label: "insydercrypto" },
  { wallet: "7SKJAkT3yEwjK16BqoxpicX97vLCJcUX2kQundVAWhku", label: "callmaster100x" }
];

const UPSTREAM_BASE = "https://frontend-api-v3.pump.fun";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const targetWallet = url.searchParams.get("wallet");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Referer": "https://pump.fun/",
      "Origin": "https://pump.fun",
    };

    try {
      if (targetWallet) {
        const upstreamUrl = `${UPSTREAM_BASE}/callout/list/${targetWallet}`;
        const res = await fetch(upstreamUrl, { headers });
        if (!res.ok) {
          return new Response(JSON.stringify({ success: false, status: res.status, callouts: [] }), {
            status: 200,
            headers: { ...corsHeaders(), "Content-Type": "application/json" },
          });
        }
        const data = await res.json();
        const cutoff = Date.now() - 8 * 3600 * 1000;
        const callouts = (data.callouts || [])
          .filter((c) => {
            const t = typeof c.createdAt === "number" ? c.createdAt : (c.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : 0);
            return !t || t >= cutoff;
          })
          .map((c) => ({
            ...c,
            callerWallet: targetWallet,
          }));
        return new Response(JSON.stringify({ success: true, count: callouts.length, callouts }), {
          status: 200,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=15, s-maxage=30",
          },
        });
      }

      const allCallouts = [];
      const batchSize = 8;
      const cutoff = Date.now() - 8 * 3600 * 1000;
      for (let i = 0; i < WATCHLIST.length; i += batchSize) {
        const batch = WATCHLIST.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async ({ wallet, label }) => {
            const res = await fetch(`${UPSTREAM_BASE}/callout/list/${wallet}`, { headers });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.callouts || [])
              .filter((c) => {
                const t = typeof c.createdAt === "number" ? c.createdAt : (c.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : 0);
                return !t || t >= cutoff;
              })
              .map((c) => ({
                ...c,
                callerWallet: wallet,
                callerLabel: label,
              }));
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled" && Array.isArray(r.value)) {
            allCallouts.push(...r.value);
          }
        }
        if (i + batchSize < WATCHLIST.length) {
          await new Promise((r) => setTimeout(r, 80));
        }
      }

      return new Response(JSON.stringify({
        success: true,
        count: allCallouts.length,
        callouts: allCallouts,
        updatedAt: Date.now(),
      }), {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=15, s-maxage=30",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message, callouts: [] }), {
        status: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }
  },
};
