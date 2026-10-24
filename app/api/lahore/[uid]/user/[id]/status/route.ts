import pool from "@/config/db";
import { resolveFirebaseUser } from "@/lib/auth/resolve-firebase-user";
import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ uid: string; id: string }> };

const positiveId = (value: string) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export async function handleUserStatusPatch(
  req: NextRequest,
  context: RouteContext,
) {
  try {
    const authenticated = await resolveFirebaseUser(req);
    if (!authenticated.ok) return authenticated.response;

    const { uid, id } = await context.params;
    const targetId = positiveId(id);
    if (!targetId) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    if (positiveId(uid) !== authenticated.user.id) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    if (
      authenticated.user.full_access !== true &&
      authenticated.user.designation !== "Owner"
    ) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    const active =
      body && typeof body === "object" && "active" in body
        ? body.active
        : undefined;
    if (typeof active !== "boolean") {
      return NextResponse.json(
        { message: "active must be a boolean" },
        { status: 400 },
      );
    }

    const result = await pool.query<{ firebase_id: string | null }>(
      "SELECT firebase_id FROM users WHERE id = $1 LIMIT 1",
      [targetId],
    );
    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (user.firebase_id) {
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUser(user.firebase_id);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "auth/user-not-found"
        ) {
          return NextResponse.json(
            { message: "Linked Firebase account not found" },
            { status: 404 },
          );
        }
        throw error;
      }

      await admin.auth().updateUser(user.firebase_id, { disabled: !active });
    }
    try {
      const updated = await pool.query<{ active: boolean }>(
        "UPDATE users SET active = $1 WHERE id = $2 AND firebase_id = $3 RETURNING active",
        [active, targetId, user.firebase_id],
      );
      if (!updated.rows[0]) {
        throw new Error("User changed while updating status");
      }
      return NextResponse.json({ active: updated.rows[0].active });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { message: "Unable to update user status" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return handleUserStatusPatch(req, context);
}
