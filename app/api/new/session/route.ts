import { resolveFirebaseUser } from "@/lib/auth/resolve-firebase-user";
import { getSessionUser } from "@/lib/auth/session-user";
import { NextRequest, NextResponse } from "next/server";

function requestedCity(request: NextRequest): string {
  const referrer = request.headers.get("referer");
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (url.origin !== request.nextUrl.origin) return "";
    const city = url.pathname.split("/")[1]?.toLowerCase();
    return city === "lahore" || city === "karachi" ? city : "";
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const resolved = await resolveFirebaseUser(request);
  if (!resolved.ok) return resolved.response;

  try {
    const user = await getSessionUser(resolved.user.id, requestedCity(request));
    if (!user) {
      return NextResponse.json(
        { message: "Your account is not linked to an active user." },
        { status: 403 },
      );
    }
    return NextResponse.json(user, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Session lookup failed", error);
    return NextResponse.json(
      { message: "Unable to load your session." },
      { status: 500 },
    );
  }
}
