// Cloudflare Worker: Pump.fun Real Callouts & User Callout Proxy
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
  { wallet: "2T5NgDDidkvhJQg8AHDi74uCFwgp25pYFMRZXBaCUNBH", label: "untaxxable" },
  { wallet: "CjbR3XxCw3LmBF3X1uDC1ynsk1rhd1gGtuMkLHF6AT6L", label: "Scharo" },
  { wallet: "GfXQesPe3Zuwg8JhAt6Cg8euJDTVx751enp9EQQmhzPH", label: "spuno" },
  { wallet: "ASv4ktNwZ8uBbUj94ACnr7Nj1sTtcYnEUZgWxkMsakA7", label: "retardmode" },
  { wallet: "8oQoMhfBQnRspn7QtNAq2aPThRE4q94kLSTwaaFQvRgs", label: "bigbagsbobby" },
  { wallet: "BAr5csYtpWoNpwhUjixX7ZPHXkUciFZzjBp9uNxZXJPh", label: "jackduvalcalls" },
  { wallet: "2jgmHtkCkJXm3Xq4dp9DgippkQjXLK3rhaREAz7oG7s7", label: "six666888eight" },
  { wallet: "EnPjBjzy6zaufzpZ2m3Q8nPS3KpyiRxNLKtcSiMYwWCa", label: "collectible" },
  { wallet: "DdM1tyCdoEyoxYYmGMjdf5rRPcpmj3UzZTpE7ScuTf7d", label: "FlippingProfits" },
  { wallet: "33Mduffr6xQBvERJaJBRSAG6pAcQtGq1qDdKt6MF4vBn", label: "Contra" },
  { wallet: "G29kbPokFzmVeYuZB1ihA7AmGzLjyDaECEyRMKhHiR4J", label: "Mannerssx" },
  { wallet: "21rgbFW6sujQovCw3qt6R2EdE97Yzzvk8sSc37Bb72Cm", label: "hexiecs" },
  { wallet: "BQ4KBzzXXk6ZMxVQb4mePuUbJfe85MerzYj53eatzUWd", label: "brc20niubi" },
  { wallet: "G3sYJ99sqZy39m98qSP9De543Ae2zHy8B6we7tb7z3jT", label: "BigGoldPony" },
  { wallet: "EFpQWGxuoS9nxB1sX9x6LTJAvsnKxcnpZpMmz3QDGnfJ", label: "hotdogenj0yer" },
  { wallet: "64w4qRu9VGio7U1Asc6B68QDpS8L1McmSn2yyExC6Fii", label: "lbexplorer" },
  { wallet: "82m59BvGrbCSKUXhuqdNXP7pSnYQEasLhWCek7zsbXpT", label: "Dimi" },
  { wallet: "AK18Ru6UzvbhBWcfnhALuMM4hSXvyDCmvMkrZD3QQqrU", label: "zinc" },
  { wallet: "8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6", label: "cooker" },
  { wallet: "AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm", label: "MandingoThe3rd" },
  { wallet: "2QrfK8gf3vBcFfuaCJbFxGk3w1JxwjamGE9aGwdQHFas", label: "Thokani" },
  { wallet: "BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX", label: "Risk100x" },
  { wallet: "DrkWK9ew2NneZMLvX8vfVsYRunk9hb6SHcKr11RJphEB", label: "foreskin" },
  { wallet: "J23qr98GjGJJqKq9CBEnyRhHbmkaVxtTJNNxKu597wsA", label: "gr3gor14n" },
  { wallet: "4UrFSCrGxgoCtCUBAEZq7ZmPK3Pczkxx7PwYnkBMi1KR", label: "J777Crypto" },
  { wallet: "DYAn4XpAkN5mhiXkRB7dGq4Jadnx6XYgu8L5b3WGhbrt", label: "KayThedoc" },
  { wallet: "6QAqPr36syxZ8WGDofU5pQ8kRaMM2ZQ94GVvQa8hjFu7", label: "IApeShitters" },
  { wallet: "3dd6LCE3p88ohQx8iZpnfrfPQGkifvXE6PtrbXAsBEit", label: "dourfussydecor" },
  { wallet: "2iUf9W2o3pZ6iszEV9JWFYUKsATGt4Li5wAB5D2nFaXV", label: "fukupapers" },
  { wallet: "41uh7g1DxYaYXdtjBiYCHcgBniV9Wx57b7HU7RXmx1Gg", label: "lowskii" },
  { wallet: "4z3WtX32eehkmnaNNstZWyAuVBhj6cgpk5JtkdTa4m4A", label: "jspizzlecryptoo" },
  { wallet: "CpqBZF4V98AFGK9yDXFT2AiX7E3BqkJmhrCJnuxCvv46", label: "moonjellyfish33" },
  { wallet: "iPUp3qkm39ycMGbywWFMUyvaDhiiPGXeWXaDtmHNe6C", label: "arcnikolas" },
  { wallet: "5cFZ9qw5kovwJXQQHCVDQWPEQH9e7UXvitq5ET17sZrP", label: "mikael_ch" },
  { wallet: "CE44oKS3wpUerx8afyeii56u5oQjBLZknzm4Q2CYHUz9", label: "ely" },
  { wallet: "57gsfHMx48nMxF5WX5RXTuYWijHZCm34zrCKrSE199hX", label: "Applebottomjean" },
  { wallet: "6qudAN2kV8mtCcYJxb5QQ6Vr15itdHHdeVbYm99NKMhy", label: "thedetective" },
  { wallet: "7YndBV5gp3VvAiBbSfv8M7CoyMhFsiKeGYWkwee49fTg", label: "poe" },
  { wallet: "DB8srMNYiifrgKJyAuDzj8RvNvw8PLKruWcRevGhUQYW", label: "bon_g" },
  { wallet: "G3g1CKqKWSVEVURZDNMazDBv7YAhMNTjhJBVRTiKZygk", label: "insydercrypto" },
  { wallet: "7SKJAkT3yEwjK16BqoxpicX97vLCJcUX2kQundVAWhku", label: "callmaster100x" },
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
        const callouts = (data.callouts || []).map((c) => ({
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
      for (let i = 0; i < WATCHLIST.length; i += batchSize) {
        const batch = WATCHLIST.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async ({ wallet, label }) => {
            const res = await fetch(`${UPSTREAM_BASE}/callout/list/${wallet}`, { headers });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.callouts || []).map((c) => ({
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
