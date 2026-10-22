import "server-only";

import pool from "@/config/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { NextResponse } from "next/server";

export type ResolvedFirebaseUser = {
  id: number;
  office_id: number;
  designation: string | null;
  full_access: boolean | null;
};

type Resolution =
  | { ok: true; user: ResolvedFirebaseUser }
  | { ok: false; response: NextResponse };

export async function resolveFirebaseUser(request: Request): Promise<Resolution> {
  const authenticated = await requireAuth(request);
  if (!authenticated.ok) return authenticated;

  const result = await pool.query<ResolvedFirebaseUser>(
    `SELECT id, office_id, designation, full_access
       FROM public.users
      WHERE firebase_id = $1 AND active = true
      LIMIT 1`,
    [authenticated.token.uid],
  );
  const user = result.rows[0];
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Your account is not linked to an active user." },
        { status: 403 },
      ),
    };
  }
  return { ok: true, user };
}
