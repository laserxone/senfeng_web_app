import pool from "@/config/db";
import { LOCAL_AUTH_EMAIL } from "@/lib/auth/local-auth-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.toLowerCase() !== LOCAL_AUTH_EMAIL
    ) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const result = await pool.query(
      `
        SELECT id
        FROM users
        WHERE LOWER(email) = $1
          AND active = true
          AND password_hash = crypt($2, password_hash)
        LIMIT 1
      `,
      [LOCAL_AUTH_EMAIL, password],
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    return NextResponse.json({ email: LOCAL_AUTH_EMAIL });
  } catch (error) {
    console.error("Local login failed", error);
    return NextResponse.json(
      { message: "Unable to sign in. Please try again." },
      { status: 500 },
    );
  }
}
