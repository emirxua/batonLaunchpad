import { NextResponse } from "next/server";
import { getClient, ensureInit } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory active presence map (IP or session key -> last active timestamp)
const activeSessions = new Map<string, number>();

// Clean up stale sessions older than 90 seconds
function cleanupStaleSessions() {
  const cutoff = Date.now() - 90_000;
  for (const [key, lastSeen] of activeSessions.entries()) {
    if (lastSeen < cutoff) {
      activeSessions.delete(key);
    }
  }
}

export async function GET(request: Request) {
  try {
    // 1. Register heartbeat from requesting client
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local_client";

    const clientKey = `${ip}`;
    activeSessions.set(clientKey, Date.now());

    cleanupStaleSessions();

    const activeCount = Math.max(1, activeSessions.size);

    // 2. Query total registered Turso DB users
    let totalRegisteredUsers = 1;
    try {
      await ensureInit();
      const client = getClient();
      const res = await client.execute("SELECT COUNT(*) as count FROM users;");
      if (res.rows.length > 0) {
        totalRegisteredUsers = Number(res.rows[0].count) || 1;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      activeUsers: activeCount,
      totalRegisteredUsers,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("API /api/stats/active-users error:", error);
    return NextResponse.json({
      success: true,
      activeUsers: 1,
      totalRegisteredUsers: 1,
    });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
