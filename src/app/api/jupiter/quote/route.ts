import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inputMint =
      searchParams.get("inputMint") ||
      "So11111111111111111111111111111111111111112";
    const outputMint = searchParams.get("outputMint");
    const amount = searchParams.get("amount") || "100000000";
    const slippageBps = searchParams.get("slippageBps") || "50";

    if (!outputMint) {
      return NextResponse.json(
        { error: "outputMint is required" },
        { status: 400 }
      );
    }

    const jupRes = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        cache: "no-store",
      }
    );

    if (!jupRes.ok) {
      const errText = await jupRes.text();
      return NextResponse.json(
        { error: "Jupiter API error", details: errText },
        { status: jupRes.status }
      );
    }

    const data = await jupRes.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
