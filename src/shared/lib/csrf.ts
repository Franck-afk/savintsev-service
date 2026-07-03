import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || "http://localhost:3000",
];

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    if (host && originHost === host) return true;
    return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
  } catch {
    return false;
  }
}

export function csrfGuard(request: Request): NextResponse | null {
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  return null;
}
