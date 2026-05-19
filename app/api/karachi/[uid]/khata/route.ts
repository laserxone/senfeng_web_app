
import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await pool.query(
    `SELECT * FROM khata ORDER BY created_at DESC`
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { name, start_date, end_date, note } = body;

  const result = await pool.query(
    `
    INSERT INTO khata (name, start_date, end_date, note)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [name, start_date, end_date, note]
  );

  return NextResponse.json(result.rows[0]);
}