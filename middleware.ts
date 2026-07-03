import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { roleRoutes } from "@/shared/constants/role-routes";

const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/seed", "/privacy"];
const publicApiRoutes = ["/api/auth/"];

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
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
