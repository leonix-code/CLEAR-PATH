import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

// Client-side auth is handled by the layout. This middleware only
// provides a basic redirect for direct URL access without auth.
// Token is stored in localStorage (client-side), not cookies.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static files
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // For protected routes, let the client-side layout handle auth
  // since we can't read localStorage from middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|api).*)",
  ],
};
