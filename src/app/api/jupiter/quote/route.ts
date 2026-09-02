import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOL_MINT = "So11111111111111111111111111111111111111112";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const outputMint =
      searchParams.get("outputMint") ||
      "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";
    const amountStr = searchParams.get("amount") || "500000000"; // 0.5 SOL in lamports

    // 1. Jupiter Standard Quote Request
    for (const baseUrl of [
      "https://api.jup.ag/swap/v1/quote",
      "https://lite-api.jup.ag/swap/v1/quote",
      "https://public.jupiterapi.com/quote",
    ]) {
      try {
        const jupUrl = `${baseUrl}?inputMint=${SOL_MINT}&outputMint=${outputMint}&amount=${amountStr}&slippageBps=1500`;
        const jupRes = await fetch(jupUrl, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          cache: "no-store",
        });

        if (jupRes.ok) {
          const jupData = await jupRes.json();
          if (jupData && jupData.outAmount) {
            return NextResponse.json({
              success: true,
              ...jupData,
              source: "jupiter",
            });
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    // 2. Fallback: Dynamic SOL/$BATON parity calculation via DexScreener
    const dexRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${outputMint}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );
    const dexData = await dexRes.json();
    const pair = dexData?.pairs?.[0];

    if (pair && pair.priceNative) {
      const solAmount = Number(amountStr) / 1e9;
      const priceInSol = parseFloat(pair.priceNative); // 1 Token price in SOL
      if (priceInSol > 0) {
        const estimatedTokens = solAmount / priceInSol;
        const decimals = outputMint.endsWith("pump") ? 6 : 9;
        const outAmountRaw = Math.floor(
          estimatedTokens * Math.pow(10, decimals)
        ).toString();

        return NextResponse.json({
          success: true,
          outAmount: outAmountRaw,
          priceImpactPct: "0.01",
          routePlan: [{ swapInfo: { label: "DexScreener/Pump Bonding" } }],
          source: "dexscreener_fallback",
        });
      }
    }

    return NextResponse.json(
      { error: "Route not available" },
      { status: 404 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Quote error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
