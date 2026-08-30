import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const JUP_V6 = "https://quote-api.jup.ag/v6/quote";
const JUP_PRIMARY = "https://api.jup.ag/swap/v1/quote";
const JUP_FALLBACK = "https://lite-api.jup.ag/swap/v1/quote";
const FETCH_MS = 6000;

async function fetchWithTimeout(url: string, ms = FETCH_MS): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(id);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inputMint = searchParams.get("inputMint")?.trim() || SOL_MINT;
  const outputMint = searchParams.get("outputMint")?.trim();
  const amountHuman = searchParams.get("amount")?.trim(); // human-readable
  const isAutoSlippage = searchParams.get("autoSlippage") === "true" || searchParams.get("slippageBps") === "auto";
  const slippageBps = isAutoSlippage ? 1500 : parseInt(searchParams.get("slippageBps") ?? "1500");

  if (!outputMint || !amountHuman) {
    return NextResponse.json({ error: "outputMint and amount required" }, { status: 400 });
  }

  const amountFloat = parseFloat(amountHuman);
  if (isNaN(amountFloat) || amountFloat <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  // Calculate raw input amount according to token decimals
  const isInputSol = inputMint === SOL_MINT;
  const inputDecimals = isInputSol ? 9 : parseInt(searchParams.get("inputDecimals") ?? "6");
  const rawInputAmount = Math.round(amountFloat * Math.pow(10, inputDecimals));

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(rawInputAmount),
  });

  if (isAutoSlippage) {
    params.append("autoSlippage", "true");
    params.append("maxAutoSlippageBps", "2500");
  } else {
    params.append("slippageBps", String(slippageBps));
  }

  // Try Jupiter V6 endpoint first, fallback to standard Jupiter endpoints
  let quoteData: Record<string, unknown> | null = null;

  for (const base of [JUP_V6, JUP_PRIMARY, JUP_FALLBACK]) {
    try {
      const res = await fetchWithTimeout(`${base}?${params.toString()}`);
      if (res.ok) {
        quoteData = await res.json();
        if (quoteData && quoteData.outAmount) break;
      }
    } catch {
      // try next
    }
  }

  // If Jupiter failed and token is pump.fun or new bonding curve, build PumpPortal quote fallback
  if (!quoteData || !quoteData.outAmount) {
    try {
      const dexRes = await fetchWithTimeout(
        `https://api.dexscreener.com/latest/dex/tokens/${outputMint}`,
        4000
      );
      if (dexRes.ok) {
        const dexData = await dexRes.json();
        const pair = dexData?.pairs?.[0];
        if (pair && pair.priceNative) {
          const priceInSol = parseFloat(pair.priceNative);
          if (priceInSol > 0) {
            const estimatedTokens = isInputSol ? amountFloat / priceInSol : amountFloat * priceInSol;
            const decimals = isInputSol ? (outputMint.toLowerCase().endsWith("pump") ? 6 : 9) : 9;
            const rawOut = Math.floor(estimatedTokens * Math.pow(10, decimals));

            const pumpQuote = {
              inputMint,
              outputMint,
              inAmount: String(rawInputAmount),
              outAmount: String(rawOut),
              priceImpactPct: "0.01",
              slippageBps,
              routePlan: [{ swapInfo: { label: "PumpPortal Bonding Curve" } }],
              source: "pumpportal",
            };

            const outHuman = estimatedTokens;

            return NextResponse.json({
              success: true,
              inputMint,
              outputMint,
              inputAmountHuman: amountFloat,
              inputAmountRaw: rawInputAmount,
              outAmountRaw: String(rawOut),
              outAmountHuman: outHuman,
              outAmountFormatted: outHuman.toLocaleString("en-US", { maximumFractionDigits: 4 }),
              priceImpactPct: 0.01,
              priceImpactFormatted: "< 0.01%",
              slippageBps,
              routeLabel: "PumpPortal Direct Route",
              rawQuote: pumpQuote,
              source: "pumpportal",
            });
          }
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: "Quote unavailable — token has no active liquidity route on Jupiter or PumpPortal" },
      { status: 502 }
    );
  }

  // outAmount is in raw token units (need to divide by 10^decimals)
  const rawOut = BigInt(String(quoteData.outAmount));
  const outputDecimals = outputMint === SOL_MINT ? 9 : 6;
  const outHuman = Number(rawOut) / Math.pow(10, outputDecimals);

  // priceImpactPct
  const impactRaw = parseFloat(String(quoteData.priceImpactPct ?? "0"));
  const impactFormatted =
    impactRaw < 0.01 ? "< 0.01%" : `${impactRaw.toFixed(2)}%`;

  // Extract route labels
  const routePlan = (quoteData.routePlan as { swapInfo: { label?: string } }[]) ?? [];
  const routeLabels = routePlan
    .map((r) => r?.swapInfo?.label ?? "DEX")
    .filter(Boolean)
    .join(" → ");

  return NextResponse.json(
    {
      success: true,
      inputMint,
      outputMint,
      inputAmountHuman: amountFloat,
      inputAmountRaw: rawInputAmount,
      outAmountRaw: String(rawOut),
      outAmountHuman: outHuman,
      outAmountFormatted: outHuman.toLocaleString("en-US", { maximumFractionDigits: 4 }),
      priceImpactPct: impactRaw,
      priceImpactFormatted: impactFormatted,
      slippageBps,
      routeLabel: routeLabels || "Jupiter Aggregator",
      contextSlot: quoteData.contextSlot,
      rawQuote: quoteData,
      source: "jupiter",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3, stale-while-revalidate=6",
      },
    }
  );
}
