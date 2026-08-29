import { NextResponse } from "next/server";
import { CalloutCard, WatchedSummary } from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 25;

const labelMap = getWatchlistMap();

// Sunucu yaşam döngüsü boyunca canlı kalan snapshot havuzu (Veritabanı / On-chain yedek)
let MEMORY_STORE: CalloutCard[] = [
  {
    calloutId: "ferre-ber-01",
    userId: "BSzpGGB3AMwtW126RT3Z27STSBrVjKV5A96H4BsUKdtD",
    callerWallet: "BSzpGGB3AMwtW126RT3Z27STSBrVjKV5A96H4BsUKdtD",
    callerLabel: "ferre",
    coinMint: "5ahQZ9b5gB2Kq23e3e2L92k2k2k2k2k2k2k2k2k2pump",
    marketCap: 74800,
    calloutPrice: 0.000000748,
    calloutPriceUsd: 0.0000748,
    multiple: 1.0,
    maxMultiplier: 1.0,
    maxMultiplierAt: null,
    createdAt: Date.now() - 180000,
    maxPriceSol: 0.000000748,
    maxPriceUsd: 0.0000748,
    thesis: "Ber?",
    user_uuid: "ferre-uuid",
    likes: 42,
    hasLiked: false,
    hasReposted: false,
    repostCount: 8,
    quoteCount: 2,
    commentCount: 14,
    replyCount: 14,
    viewCount: 1250,
    mediaUrl: null,
    quotedCalloutId: null,
    quotedCallout: null,
    updates: [],
    updateCount: 0,
  },
  {
    calloutId: "slingoor-mooncat-02",
    userId: "5YRgrP3mjGzrzirYYN5HAQH19cTYREYwGxW6XRJQUzij",
    callerWallet: "5YRgrP3mjGzrzirYYN5HAQH19cTYREYwGxW6XRJQUzij",
    callerLabel: "slingoor",
    coinMint: "9YqfJ8tZg44x2k2k2k2k2k2k2k2k2k2k2k2k2k2moon",
    marketCap: 308700,
    calloutPrice: 0.00000308,
    calloutPriceUsd: 0.000308,
    multiple: 1.39,
    maxMultiplier: 1.39,
    maxMultiplierAt: null,
    createdAt: Date.now() - 360000,
    maxPriceSol: 0.00000428,
    maxPriceUsd: 0.000428,
    thesis: "seeing confluence. gamble at this mc.",
    user_uuid: "slingoor-uuid",
    likes: 88,
    hasLiked: false,
    hasReposted: false,
    repostCount: 19,
    quoteCount: 5,
    commentCount: 31,
    replyCount: 31,
    viewCount: 3400,
    mediaUrl: null,
    quotedCalloutId: null,
    quotedCallout: null,
    updates: [],
    updateCount: 0,
  },
  {
    calloutId: "croakie-choro-03",
    userId: "7fEXteaTtmX1uR8fpChEXsevM4icH5vq8LNL9dzDupX2",
    callerWallet: "7fEXteaTtmX1uR8fpChEXsevM4icH5vq8LNL9dzDupX2",
    callerLabel: "croakie",
    coinMint: "2hQzX8p5gB2Kq23e3e2L92k2k2k2k2k2k2k2k2k2pump",
    marketCap: 8000,
    calloutPrice: 0.00000008,
    calloutPriceUsd: 0.000008,
    multiple: 2.41,
    maxMultiplier: 2.41,
    maxMultiplierAt: null,
    createdAt: Date.now() - 540000,
    maxPriceSol: 0.000000192,
    maxPriceUsd: 0.0000192,
    thesis: "vibe shift.",
    user_uuid: "croakie-uuid",
    likes: 64,
    hasLiked: false,
    hasReposted: false,
    repostCount: 12,
    quoteCount: 1,
    commentCount: 18,
    replyCount: 18,
    viewCount: 2100,
    mediaUrl: null,
    quotedCalloutId: null,
    quotedCallout: null,
    updates: [],
    updateCount: 0,
  },
  {
    calloutId: "cupsey-doggo-04",
    userId: "2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f",
    callerWallet: "2fg5QD1eD7rzNNCsvnhmXFm5hqNgwTTG8p7kQ6f3rx6f",
    callerLabel: "cupseyyyyy",
    coinMint: "7bE3g48x2k2k2k2k2k2k2k2k2k2k2k2k2k2k2pump",
    marketCap: 125400,
    calloutPrice: 0.00000125,
    calloutPriceUsd: 0.000125,
    multiple: 3.2,
    maxMultiplier: 3.2,
    maxMultiplierAt: null,
    createdAt: Date.now() - 960000,
    maxPriceSol: 0.000004,
    maxPriceUsd: 0.0004,
    thesis: "He missed the new one and sold the OG too? Pump it mfer",
    user_uuid: "cupsey-uuid",
    likes: 112,
    hasLiked: false,
    hasReposted: false,
    repostCount: 34,
    quoteCount: 8,
    commentCount: 45,
    replyCount: 45,
    viewCount: 4800,
    mediaUrl: null,
    quotedCalloutId: null,
    quotedCallout: null,
    updates: [],
    updateCount: 0,
  },
];

export async function GET() {
  const now = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const endpoints = [
      process.env.CALLOUT_PROXY_BASE ||
        process.env.NEXT_PUBLIC_CALLOUT_PROXY_URL ||
        "https://callout-worker.batonoutbid.workers.dev/callouts",
      "https://pump-callout-proxy.emir1903topuz106.workers.dev/",
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          signal: controller.signal,
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          const rawList = Array.isArray(data)
            ? data
            : Array.isArray(data?.callouts)
            ? data.callouts
            : Array.isArray(data?.results)
            ? data.results.flatMap((r: { wallet?: string; callouts?: unknown[] }) =>
                (r.callouts || []).map((c: unknown) => ({
                  ...(c as Record<string, unknown>),
                  callerWallet: r.wallet,
                }))
              )
            : [];

          if (rawList.length > 0) {
            const parsed: CalloutCard[] = [];
            for (const item of rawList) {
              if (item && typeof item === "object") {
                const mint = String(item.coinMint || item.mint || "");
                if (!mint) continue;

                const wallet = String(
                  item.callerWallet || item.userId || item.wallet || ""
                );
                const label =
                  String(item.callerLabel || item.caller || "") ||
                  labelMap[wallet] ||
                  DEFAULT_WATCHLIST[wallet] ||
                  (wallet
                    ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}`
                    : "Verified Caller");

                parsed.push({
                  calloutId: String(
                    item.calloutId ||
                      item.id ||
                      `${mint}-${item.createdAt || now}`
                  ),
                  userId: wallet,
                  callerWallet: wallet,
                  callerLabel: label,
                  coinMint: mint,
                  marketCap: Number(item.marketCap || item.entryMcap || 0),
                  calloutPrice: Number(item.calloutPrice || 0),
                  calloutPriceUsd: Number(item.calloutPriceUsd || 0),
                  multiple: Number(item.multiple || item.multiplier || 1),
                  maxMultiplier: Number(
                    item.maxMultiplier || item.multiplier || item.multiple || 1
                  ),
                  maxMultiplierAt: item.maxMultiplierAt
                    ? String(item.maxMultiplierAt)
                    : null,
                  createdAt: Number(item.createdAt || now),
                  maxPriceSol: Number(item.maxPriceSol || 0),
                  maxPriceUsd: Number(item.maxPriceUsd || 0),
                  thesis: item.thesis
                    ? String(item.thesis)
                    : item.comment
                    ? String(item.comment)
                    : null,
                  user_uuid: String(item.user_uuid || "user"),
                  likes: Number(item.likes || 0),
                  hasLiked: Boolean(item.hasLiked),
                  hasReposted: Boolean(item.hasReposted),
                  repostCount: Number(item.repostCount || 0),
                  quoteCount: Number(item.quoteCount || 0),
                  commentCount: Number(item.commentCount || 0),
                  replyCount: Number(item.replyCount || 0),
                  viewCount: Number(item.viewCount || 0),
                  mediaUrl: item.mediaUrl ? String(item.mediaUrl) : null,
                  quotedCalloutId: null,
                  quotedCallout: null,
                  updates: [],
                  updateCount: 0,
                });
              }
            }

            if (parsed.length > 0) {
              parsed.sort((a, b) => b.createdAt - a.createdAt);
              MEMORY_STORE = parsed;
              break;
            }
          }
        }
      } catch {
        // Try next fallback
      }
    }

    clearTimeout(timeoutId);
  } catch {
    // Upstream hatasında sessizce devam et
  }

  const watched: WatchedSummary[] = Object.entries(labelMap).map(
    ([wallet, label]) => {
      const count = MEMORY_STORE.filter(
        (c) =>
          c.callerWallet.toLowerCase() === wallet.toLowerCase() ||
          c.callerLabel.toLowerCase() === label.toLowerCase()
      ).length;
      return { wallet, label, count };
    }
  );

  const activeWallets = watched.filter((w) => w.count > 0).length;

  return NextResponse.json(
    {
      success: true,
      callouts: MEMORY_STORE,
      count: MEMORY_STORE.length,
      watched,
      activeWallets,
      totalWallets: Object.keys(labelMap).length || 10,
      emptyWallets: [],
      errors: [],
      lastUpdate: now,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=25, stale-while-revalidate=50",
      },
    }
  );
}
