import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await pool.query(`
      SELECT id, name, email, designation
      FROM users
      WHERE active = true
      ORDER BY name ASC
    `);
    return NextResponse.json(users.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
