import { NextResponse } from "next/server";
import { getFallbackCoins } from "@/lib/tracked-coins";

export const dynamic = "force-dynamic";

export async function GET() {
  const coins = getFallbackCoins();

  return NextResponse.json({
    success: true,
    count: coins.length,
    data: coins,
    timestamp: Date.now(),
  });
}
