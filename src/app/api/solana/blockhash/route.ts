import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim(),
  "https://solana-rpc.publicnode.com",
  "https://nodes.mewapi.io/rpc/sol",
  "https://api.mainnet-beta.solana.com",
].filter((u): u is string => Boolean(u && u.startsWith("http")));

export async function GET() {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      return NextResponse.json(
        {
          success: true,
          blockhash,
          lastValidBlockHeight,
          endpoint,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    } catch (err) {
      console.warn(`[Blockhash Proxy] Failed on ${endpoint}:`, err);
    }
  }

  return NextResponse.json(
    { success: false, error: "Failed to fetch latest blockhash from all Solana RPCs" },
    { status: 502 }
  );
}
