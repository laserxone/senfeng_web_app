import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: khataId } = await params;

  const result = await pool.query(
    `
    SELECT *
    FROM khata_payments
    WHERE khata_id = $1
    ORDER BY date DESC
    `,
    [khataId],
  );

  return NextResponse.json(result.rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: khataId } = await params;
  const body = await req.json();

  const { amount, date, remarks, tid } = body;

  const result = await pool.query(
    `
    INSERT INTO khata_payments (khata_id, amount, date, remarks, tid)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [khataId, amount, date, remarks, tid],
  );

  return NextResponse.json(result.rows[0]);
}
