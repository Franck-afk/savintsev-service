import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { roleRoutes } from "@/shared/constants/role-routes";

const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/seed", "/privacy"];
const publicApiRoutes = ["/api/auth/"];

const loginRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginRateLimit.get(ip);
  if (!record || now > record.resetAt) {
    loginRateLimit.set(ip, { count: 1, resetAt: now + 300000 });
    return true;
  }
  if (record.count >= 10) return false;
  record.count++;
  return true;
}

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    if (host && originHost === host) return true;
    const allowed = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return origin.startsWith(allowed);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/")) {
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      if (pathname.startsWith("/api/auth/callback") && method === "POST") {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        if (!checkLoginRateLimit(ip)) {
          return NextResponse.json({ error: "Слишком много попыток. Попробуйте через 5 минут" }, { status: 429 });
        }
      }
      return addSecurityHeaders(NextResponse.next());
    }

    if (method === "POST" || method === "PATCH" || method === "DELETE" || method === "PUT") {
      if (!validateOrigin(request)) {
        return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    }

    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return addSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string | undefined;
  if (!userRole) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const allowedRoutes = roleRoutes[userRole] || [];
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));
  if (!isAllowed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ws: wss:; frame-ancestors 'none';"
  );
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
