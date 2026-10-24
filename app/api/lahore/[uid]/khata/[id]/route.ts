import pool from "@/config/db";
import { NextResponse } from "next/server";

async function putKhata(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
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
    WHERE id = $5 AND office = $6
    RETURNING *
    `,
    [name, start_date, end_date, note, id, office],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Khata not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

async function deleteKhata(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
) {
  const { id } = await params;

  const result = await pool.query(
    `DELETE FROM khata WHERE id = $1 AND office = $2 RETURNING id`,
    [id, office],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Khata not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

async function getKhataById(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
) {
  const { id } = await params;

  const result = await pool.query(
    `
    SELECT *
    FROM khata
    WHERE id = $1 AND office = $2
    `,
    [id, office],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Khata not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export const createKhataDetailHandlers = (office: "lahore" | "karachi") => ({
  GET: (req: Request, context: { params: Promise<{ id: string }> }) =>
    getKhataById(req, context, office),
  PUT: (req: Request, context: { params: Promise<{ id: string }> }) =>
    putKhata(req, context, office),
  DELETE: (req: Request, context: { params: Promise<{ id: string }> }) =>
    deleteKhata(req, context, office),
});

export const { GET, PUT, DELETE } = createKhataDetailHandlers("lahore");
