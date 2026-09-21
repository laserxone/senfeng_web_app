import { NextRequest, NextResponse } from "next/server";

const allowedRootDomain = "senfenglaserpk.com";

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const isAllowedDomain =
    hostname === allowedRootDomain || hostname.endsWith(`.${allowedRootDomain}`);
  const isLocalDevelopment =
    process.env.NODE_ENV === "development" &&
    (hostname === "localhost" || hostname === "127.0.0.1");

  if (!isAllowedDomain && !isLocalDevelopment) {
    return new NextResponse("Unknown host", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
