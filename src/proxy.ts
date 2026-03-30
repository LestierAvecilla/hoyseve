import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function proxyFn(req: NextRequest & { auth?: { user?: { id?: string } } | null }) {
  const session = req.auth;
  const { nextUrl } = req;
  const isLoggedIn = !!session;

  const protectedPaths = ["/watchlist", "/profile"];
  const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// auth() wraps the handler and injects session into req.auth
export const proxy = auth(proxyFn as Parameters<typeof auth>[0]);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
