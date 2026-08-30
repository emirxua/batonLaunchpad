import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchPumpPortalTrade(
  userPublicKey: string,
  outputMint: string,
  solAmount: number,
  slippagePercent: number = 15
): Promise<string | null> {
  try {
    const res = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; BatonSwap/1.0)",
      },
      body: JSON.stringify({
        publicKey: userPublicKey,
        action: "buy",
        mint: outputMint,
        amount: solAmount,
        denominatedInSol: "true",
        slippage: slippagePercent,
        priorityFee: 0.0005,
        pool: "pump",
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        return Buffer.from(buffer).toString("base64");
      }
    }
    return null;
  } catch (e) {
    console.warn("[PumpPortal Fallback Error]:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteResponse, userPublicKey } = body;

    if (!quoteResponse || !userPublicKey) {
      return NextResponse.json(
        { error: "Missing required parameters (quoteResponse, userPublicKey)" },
        { status: 400 }
      );
    }

    const outputMint = quoteResponse.outputMint || quoteResponse.rawQuote?.outputMint || "";
    const inAmountLamports = Number(quoteResponse.inAmount || quoteResponse.inputAmountLamports || 100000000);
    const solAmount = inAmountLamports / 1e9;
    const slippagePercent = Math.max(
      15,
      Math.round((quoteResponse.slippageBps || 1500) / 100)
    );

    // 1. If explicitly routed via PumpPortal
    if (quoteResponse.source === "pumpportal" && outputMint) {
      const pumpTx = await fetchPumpPortalTrade(
        userPublicKey,
        outputMint,
        solAmount,
        slippagePercent
      );
      if (pumpTx) {
        return NextResponse.json({
          swapTransaction: pumpTx,
          source: "pumpportal",
        });
      }
    }

    // 2. Jupiter V6 Swap API Execution
    const jupQuote = quoteResponse.rawQuote || quoteResponse;

    // Ensure all numeric slot values in routePlan are strings for Jupiter v6 validator
    if (jupQuote.routePlan && Array.isArray(jupQuote.routePlan)) {
      for (const step of jupQuote.routePlan) {
        if (step?.swapInfo?.updateContextSlot !== undefined && typeof step.swapInfo.updateContextSlot !== "string") {
          step.swapInfo.updateContextSlot = String(step.swapInfo.updateContextSlot);
        }
      }
    }

    const payload = JSON.stringify({
      quoteResponse: jupQuote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      useSharedAccounts: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
      asLegacyTransaction: false,
    });

    let swapData: Record<string, unknown> | null = null;
    let lastError = "";

    for (const url of [
      "https://quote-api.jup.ag/v6/swap",
      "https://api.jup.ag/swap/v1/swap",
      "https://lite-api.jup.ag/swap/v1/swap",
    ]) {
      try {
        const swapRes = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          body: payload,
          cache: "no-store",
        });

        if (swapRes.ok) {
          swapData = await swapRes.json();
          if (swapData && swapData.swapTransaction) break;
        } else {
          const text = await swapRes.text();
          try {
            const parsed = JSON.parse(text);
            lastError = parsed.error || parsed.message || parsed.description || text;
          } catch {
            lastError = text;
          }
        }
      } catch (e: unknown) {
        lastError = e instanceof Error ? e.message : "Connection failed";
      }
    }

    if (swapData && swapData.swapTransaction) {
      return NextResponse.json({
        ...swapData,
        source: "jupiter",
      });
    }

    // 3. Fallback to PumpPortal if Jupiter failed and token has a mint
    if (outputMint) {
      const pumpTx = await fetchPumpPortalTrade(
        userPublicKey,
        outputMint,
        solAmount,
        slippagePercent
      );
      if (pumpTx) {
        return NextResponse.json({
          swapTransaction: pumpTx,
          source: "pumpportal",
        });
      }
    }

    console.error("[Jupiter Swap Error Details]:", lastError);
    return NextResponse.json(
      {
        error: "Failed to construct swap transaction",
        details: lastError || "No route or liquidity available for this token",
      },
      { status: 502 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Swap transaction error";
    console.error("[Jupiter Swap Route Exception]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
