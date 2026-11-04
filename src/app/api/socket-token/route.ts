import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { auth } from "@/shared/config/auth";
import { SOCKET_TOKEN_SALT, SOCKET_TOKEN_TTL_SECONDS } from "@/shared/lib/socket-io";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  const token = await encode({
    token: { sub: session.user.id, purpose: "socket" },
    secret,
    salt: SOCKET_TOKEN_SALT,
    maxAge: SOCKET_TOKEN_TTL_SECONDS,
  });

  return NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } },
  );
}
