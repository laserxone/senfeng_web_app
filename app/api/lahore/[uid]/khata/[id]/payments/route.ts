import pool from "@/config/db";
import { NextResponse } from "next/server";

async function getKhataPayments(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
) {
  const { id: khataId } = await params;

  const result = await pool.query(
    `
    SELECT kp.*
    FROM khata_payments kp
    JOIN khata k ON k.id = kp.khata_id
    WHERE kp.khata_id = $1 AND k.office = $2
    ORDER BY kp.date DESC
    `,
    [khataId, office],
  );

  return NextResponse.json(result.rows);
}

async function postKhataPayment(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
) {
  const { id: khataId } = await params;
  const body = await req.json();

  const { amount, date, remarks, tid } = body;

  const result = await pool.query(
    `
    INSERT INTO khata_payments (khata_id, amount, date, remarks, tid)
    SELECT k.id, $2, $3, $4, $5
    FROM khata k
    WHERE k.id = $1 AND k.office = $6
    RETURNING *
    `,
    [khataId, amount, date, remarks, tid, office],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Khata not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export const createKhataPaymentHandlers = (office: "lahore" | "karachi") => ({
  GET: (req: Request, context: { params: Promise<{ id: string }> }) =>
    getKhataPayments(req, context, office),
  POST: (req: Request, context: { params: Promise<{ id: string }> }) =>
    postKhataPayment(req, context, office),
});

export const { GET, POST } = createKhataPaymentHandlers("lahore");
