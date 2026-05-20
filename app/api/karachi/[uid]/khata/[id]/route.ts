import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();

    const { name, start_date, end_date, note } = body;

    const result = await pool.query(
        `
    UPDATE khata
    SET name = $1,
        start_date = $2,
        end_date = $3,
        note = $4
    WHERE id = $5
    RETURNING *
    `,
        [name, start_date, end_date, note, id]
    );

    return NextResponse.json(result.rows[0]);
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await pool.query(`DELETE FROM khata WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await pool.query(
    `
    SELECT *
    FROM khata
    WHERE id = $1
    `,
    [id]
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Khata not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}