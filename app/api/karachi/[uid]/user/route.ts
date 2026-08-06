import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import sendPasswordReset from "@/lib/password-reset";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );
    if (checkEmail.rows.length != 0) {
      return NextResponse.json(
        { message: "Email already exists in the system" },
        { status: 400 },
      );
    }

    const password = "1234qwer!@#";

    try {
      await admin.auth().createUser({
        email,
        password,
      });
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        console.warn(
          `Email ${email} already exists in Firebase, continuing...`,
        );
      } else {
        throw error;
      }
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    const newUser = rows[0];

    sendPasswordReset(email);

    return NextResponse.json(newUser, { status: 200 });
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error?.message || "Error adding user" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const user = searchParams.get("user");
  const withoutleave = searchParams.get("withoutleave");
  const withBranch = searchParams.get("withbranch");
  const active = searchParams.get("active");

  try {
    let query = `SELECT id, name, designation, joining_date, leaving_date, email, active, office FROM users`;

    let queryParams = [];
    let conditions = [];

    if (user) {
      query = "SELECT * FROM users";
      conditions.push(`id = $${queryParams.length + 1}`);
      queryParams.push(user);
    }

    if (withoutleave) {
      conditions.push(`(leaving_date IS NULL OR leaving_date > now())`);
    }

    if (withBranch) {
      conditions.push(`office = 'karachi'`);
    }

    if (active) {
      conditions.push(`active IS TRUE`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY name ASC;`;

    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
