import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RPC_ENDPOINTS = [
  "https://nodes.mewapi.io/rpc/sol",
  "https://api.mainnet-beta.solana.com",
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim(),
  "https://solana-rpc.publicnode.com",
].filter((u): u is string => Boolean(u && u.startsWith("http")));

const SOL_MINT = "So11111111111111111111111111111111111111112";

function normalizeIpfs(url?: string): string {
  if (!url) return "";
  if (url.includes("/ipfs/")) {
    const hash = url.split("/ipfs/")[1]?.split("?")[0];
    if (hash) return `https://pump.mypinata.cloud/ipfs/${hash}`;
  }
  if (url.startsWith("ipfs://")) {
    return `https://pump.mypinata.cloud/ipfs/${url.replace("ipfs://", "")}`;
  }
  return url;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletStr = searchParams.get("wallet")?.trim();

    if (!walletStr) {
      return NextResponse.json({ error: "Missing wallet parameter" }, { status: 400 });
    }

    let walletKey: PublicKey;
    try {
      walletKey = new PublicKey(walletStr);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    let solLamports = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawAccounts: any[] = [];
    let rpcSuccess = false;

    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        const connection = new Connection(rpcUrl, {
          commitment: "confirmed",
          confirmTransactionInitialTimeout: 8000,
        });

        const [lamports, t1, t2] = await Promise.all([
          connection.getBalance(walletKey, "confirmed"),
          connection.getParsedTokenAccountsByOwner(walletKey, { programId: TOKEN_PROGRAM_ID }).catch(() => ({ value: [] })),
          connection.getParsedTokenAccountsByOwner(walletKey, { programId: TOKEN_2022_PROGRAM_ID }).catch(() => ({ value: [] })),
        ]);

        solLamports = lamports;
        rawAccounts = [...(t1?.value || []), ...(t2?.value || [])];
        rpcSuccess = true;
        break;
      } catch (err) {
        console.warn(`[WalletPortfolio API] RPC error on ${rpcUrl}:`, err);
      }
    }

    if (!rpcSuccess) {
      return NextResponse.json({ error: "Failed to query Solana RPC" }, { status: 502 });
    }

    const solAmount = solLamports / LAMPORTS_PER_SOL;

    // Filter positive token holdings
    const holdings = rawAccounts
      .map((acc) => {
        const info = acc?.account?.data?.parsed?.info;
        if (!info) return null;
        const amount = Number(info.tokenAmount?.uiAmount || 0);
        return {
          mint: info.mint as string,
          amount,
          decimals: Number(info.tokenAmount?.decimals || 6),
        };
      })
      .filter((t): t is { mint: string; amount: number; decimals: number } => Boolean(t && t.amount > 0 && t.mint !== SOL_MINT));

    // Fetch live token prices via DexScreener & Pump.fun
    const mintsToFetch = [SOL_MINT, ...holdings.map((h) => h.mint)];
    let dexPairs: Array<any> = [];

    try {
      const dexRes = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mintsToFetch.join(",")}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (dexRes.ok) {
        const dexJson = await dexRes.json();
        dexPairs = dexJson.pairs || [];
      }
    } catch {
      // DexScreener fallback
    }

    // Determine live SOL price
    const solPair = dexPairs.find(
      (p) =>
        (p.baseToken?.address === SOL_MINT && p.quoteToken?.symbol === "USDC") ||
        (p.quoteToken?.address === SOL_MINT && p.baseToken?.symbol === "USDC") ||
        p.baseToken?.symbol === "SOL"
    );
    const solPriceUsd = parseFloat(solPair?.priceUsd || "103.5") || 103.5;
    const solValueUsd = solAmount * solPriceUsd;

    // Enrich token holdings
    const enrichedTokens = await Promise.all(
      holdings.map(async (tok) => {
        const pair = dexPairs.find((p) => p.baseToken?.address === tok.mint);
        let name = pair?.baseToken?.name || "";
        let symbol = pair?.baseToken?.symbol || "";
        let iconUrl = normalizeIpfs(pair?.info?.imageUrl);
        let priceUsd = parseFloat(pair?.priceUsd || "0") || 0;
        let priceChange24h = pair?.priceChange?.h24 || 0;

        // Custom Baton Token check
        if (tok.mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump") {
          name = name || "Baton";
          symbol = symbol || "BATON";
          iconUrl = "/images/baton-logo.png";
        }

        // If metadata or icon missing, fetch from Pump.fun
        if ((!name || !iconUrl) && tok.mint.endsWith("pump")) {
          try {
            const pumpRes = await fetch(`https://frontend-api-v3.pump.fun/coins/${tok.mint}`, {
              headers: { Accept: "application/json" },
              cache: "no-store",
            });
            if (pumpRes.ok) {
              const pumpData = await pumpRes.json();
              if (pumpData) {
                name = name || pumpData.name || "Pump Token";
                symbol = symbol || pumpData.symbol || "PUMP";
                iconUrl = iconUrl || normalizeIpfs(pumpData.image_uri);
                if (priceUsd === 0 && pumpData.usd_market_cap && pumpData.usd_market_cap > 0) {
                  priceUsd = pumpData.usd_market_cap / 1_000_000_000;
                }
              }
            }
          } catch {
            // ignore pump.fun fallback error
          }
        }

        name = name || `${tok.mint.slice(0, 4)}…${tok.mint.slice(-4)}`;
        symbol = symbol || "TOKEN";
        const valueUsd = tok.amount * priceUsd;

        return {
          mint: tok.mint,
          name,
          symbol: symbol.toUpperCase(),
          iconUrl,
          amount: tok.amount,
          decimals: tok.decimals,
          priceUsd,
          valueUsd,
          priceChange24h,
        };
      })
    );

    // Sort tokens by value descending, then amount
    enrichedTokens.sort((a, b) => b.valueUsd - a.valueUsd || b.amount - a.amount);

    const totalTokensUsd = enrichedTokens.reduce((sum, t) => sum + t.valueUsd, 0);
    const totalPortfolioUsd = solValueUsd + totalTokensUsd;

    return NextResponse.json({
      success: true,
      wallet: walletStr,
      sol: {
        amount: solAmount,
        priceUsd: solPriceUsd,
        valueUsd: solValueUsd,
      },
      tokens: enrichedTokens,
      tokenCount: enrichedTokens.length,
      totalPortfolioUsd,
      timestamp: Date.now(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load wallet portfolio";
    console.error("[WalletPortfolio Error]:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
