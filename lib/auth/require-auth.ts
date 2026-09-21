import admin from "@/lib/firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { NextRequest, NextResponse } from "next/server";

type AuthResult =
  | { ok: true; token: DecodedIdToken }
  | { ok: false; response: NextResponse };

export async function requireAuth(
  request: NextRequest,
): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");
  const idToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  try {
    const token = await admin.auth().verifyIdToken(idToken, true);
    return { ok: true, token };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Your session is invalid or has expired." },
        { status: 401 },
      ),
    };
  }
}
