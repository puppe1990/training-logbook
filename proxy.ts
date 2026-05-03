import { NextRequest, NextResponse } from "next/server";

import { getSessionFromHeaders } from "@/lib/session";

const publicRoutes = new Set(["/", "/login", "/signup"]);

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await getSessionFromHeaders(request.headers);
  const isPublicRoute = publicRoutes.has(pathname);

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
