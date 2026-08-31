import { NextResponse } from "next/server";
import { registerOrUpdateGoogleUser, getUserByEmail, getUserByGoogleId } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Failed to parse Google JWT payload:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credential, user: directUser } = body;

    let googleId = "";
    let email = "";
    let name = "";
    let avatarUrl = "";

    if (credential && typeof credential === "string") {
      const payload = parseJwtPayload(credential);
      if (!payload || !payload.email) {
        return NextResponse.json(
          { success: false, error: "Invalid Google credential token" },
          { status: 400 }
        );
      }
      googleId = payload.sub || "";
      email = payload.email || "";
      name = payload.name || payload.given_name || "";
      avatarUrl = payload.picture || "";
    } else if (directUser && directUser.email) {
      email = String(directUser.email).trim().toLowerCase();
      googleId = String(directUser.sub || directUser.googleId || directUser.id || email);
      name = String(directUser.name || email.split("@")[0]);
      avatarUrl = String(directUser.picture || directUser.avatarUrl || "");
    } else {
      return NextResponse.json(
        { success: false, error: "Google authentication credential or user object required" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid Google email address required" },
        { status: 400 }
      );
    }

    const { user, isNew, needsUsername } = await registerOrUpdateGoogleUser({
      googleId: googleId || email,
      email,
      name,
      avatarUrl,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        username: user.username || null,
        registeredAt: user.registeredAt,
      },
      isNew,
      needsUsername,
    });
  } catch (error) {
    console.error("API /api/auth/google error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during Google authentication" },
      { status: 500 }
    );
  }
}
