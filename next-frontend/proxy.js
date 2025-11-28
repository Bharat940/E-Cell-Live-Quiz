import { NextResponse } from "next/server";

export function proxy(request) {
  const adminKey = request.cookies.get("adminKey")?.value;

  if (!adminKey) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin/presentation/:path*",
  ],
};
