import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import sendPasswordReset from "@/lib/password-reset";
import { NextRequest, NextResponse } from "next/server";

export async function handleUserPost(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    const { email } = data;

    const checkEmail = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    if (checkEmail.rows.length != 0) {
      return NextResponse.json(
        { message: "Email already exists in the system" },
        { status: 400 },
      );
    }

    const password = "1234qwer!@#";
    let firebaseUid: string;

    try {
      const firebaseUser = await admin.auth().createUser({
        email,
        password,
      });
      firebaseUid = firebaseUser.uid;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "auth/email-already-exists"
      ) {
        console.warn(
          `Email ${email} already exists in Firebase, continuing...`,
        );
        firebaseUid = (await admin.auth().getUserByEmail(email)).uid;
      } else {
        throw error;
      }
    }

    const userData = { ...data, firebase_id: firebaseUid };
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    const newUser = rows[0];

    await sendPasswordReset(email);

    return NextResponse.json(newUser, { status: 200 });
  } catch (error: unknown) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error adding user" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleUserPost(req);
}

export async function handleUserGet(
  req: NextRequest,
  office: "lahore" | "karachi",
) {
  const searchParams = req.nextUrl.searchParams;
  const user = searchParams.get("user");
  const withBranch = searchParams.get("withbranch");

  try {
    let query = `SELECT id, name, designation, joining_date, leaving_date, email, active, office FROM users`;

    const queryParams = [];
    const conditions = [];

    if (user) {
      query = "SELECT * FROM users";
      conditions.push(`id = $${queryParams.length + 1}`);
      queryParams.push(user);
    }

    if (withBranch) {
      conditions.push(`office = '${office}'`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY name ASC;`;

    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: unknown) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleUserGet(req, "lahore");
}

export const revalidate = 0;
