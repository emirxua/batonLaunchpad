import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana-rpc.publicnode.com",
];

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
