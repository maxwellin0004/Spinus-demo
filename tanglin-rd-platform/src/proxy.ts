import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "local-dev-secret-change-me");
}

const protectedRoots = [
  ["/admin", "ADMIN"],
  ["/brand", "BRAND"],
  ["/creator", "CREATOR"],
] as const;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const matched = protectedRoots.find(([root]) => pathname === root || pathname.startsWith(`${root}/`));
  if (!matched) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== matched[1] || payload.status === "FROZEN") {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  } catch {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/brand/:path*", "/creator/:path*"],
};
