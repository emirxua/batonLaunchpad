import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface SubmitCoinPayload {
  name: string;
  ticker: string;
  mintAddress: string;
  twitter?: string;
  telegram?: string;
  description?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    let body: SubmitCoinPayload;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const { name, ticker, mintAddress, twitter, telegram, description } = body;

    if (!name || !ticker || !mintAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: Token Name, Token Ticker, or Solana Mint CA." },
        { status: 400 }
      );
    }

    const cleanTicker = ticker.replace(/^\$/, "").toUpperCase();
    const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}`;

    // Read Telegram environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    let telegramSent = false;
    let telegramError: string | null = null;

    if (botToken && chatId) {
      const htmlMessage = [
        "<b>🚀 NEW TOKEN LISTING APPLICATION</b>",
        "",
        `<b>Token Name:</b> ${escapeHtml(name.trim())}`,
        `<b>Ticker:</b> $${escapeHtml(cleanTicker)}`,
        `<b>Mint Address (CA):</b> <code>${escapeHtml(mintAddress.trim())}</code>`,
        `<b>X:</b> ${escapeHtml(twitter?.trim() || "N/A")}`,
        `<b>Telegram:</b> ${escapeHtml(telegram?.trim() || "N/A")}`,
        `<b>Description:</b> ${escapeHtml(description?.trim() || "N/A")}`,
        "",
        `🔗 <a href="https://pump.fun/coin/${escapeHtml(mintAddress.trim())}">View on pump.fun ↗</a> | <a href="https://solscan.io/token/${escapeHtml(mintAddress.trim())}">Solscan ↗</a>`,
      ].join("\n");

      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: htmlMessage,
              parse_mode: "HTML",
              disable_web_page_preview: false,
            }),
          }
        );

        if (tgRes.ok) {
          telegramSent = true;
        } else {
          const errJson = await tgRes.json();
          telegramError = errJson.description || "Telegram API dispatch error";
          console.warn("Telegram sendMessage non-200:", errJson);
        }
      } catch (tgErr: unknown) {
        telegramError = tgErr instanceof Error ? tgErr.message : "Network error";
        console.warn("Telegram webhook exception:", tgErr);
      }
    }

    return NextResponse.json({
      success: true,
      submissionId,
      telegramSent,
      telegramError,
      data: {
        name: name.trim(),
        ticker: cleanTicker,
        mintAddress: mintAddress.trim(),
        twitter: twitter?.trim() || "",
        telegram: telegram?.trim() || "",
        description: description?.trim() || "",
      },
      message: "Application submitted successfully!",
    });
  } catch (error) {
    console.error("API /api/submit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while processing the submission.",
      },
      { status: 500 }
    );
  }
}
