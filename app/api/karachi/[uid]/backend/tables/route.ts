import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const result = await pool.query(query);
    return NextResponse.json(result.rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
