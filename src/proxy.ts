import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Send signed-out visitors on dashboard routes to the sign-in page.
// Role checks happen again in each page (requireRole).
export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/student/:path*", "/hub/:path*"] };
