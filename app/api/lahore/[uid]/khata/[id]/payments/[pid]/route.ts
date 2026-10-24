import pool from "@/config/db";
import { NextResponse } from "next/server";

async function putKhataPayment(
  req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> },
  office: "lahore" | "karachi",
) {
  const { id: khataId, pid: paymentId } = await params;
  const body = await req.json();

  console.log(body);

  const { amount, date, remarks, tid } = body;

  const result = await pool.query(
    `
    UPDATE khata_payments kp
    SET amount = $1,
        date = $2,
        remarks = $3,
        tid = $4
    FROM khata k
    WHERE kp.id = $5 AND kp.khata_id = $6
      AND k.id = kp.khata_id AND k.office = $7
    RETURNING kp.*
    `,
    [amount, date, remarks, tid, paymentId, khataId, office],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

async function deleteKhataPayment(
  _req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> },
  office: "lahore" | "karachi",
) {
  const { id: khataId, pid: paymentId } = await params;

  const result = await pool.query(
    `
    DELETE FROM khata_payments kp
    USING khata k
    WHERE kp.id = $1 AND kp.khata_id = $2
      AND k.id = kp.khata_id AND k.office = $3
    RETURNING kp.id
    `,
    [paymentId, khataId, office],
  );

  if (!result.rows[0]) {
    return NextResponse.json({ message: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export const createKhataPaymentDetailHandlers = (
  office: "lahore" | "karachi",
) => ({
  PUT: (
    req: Request,
    context: { params: Promise<{ id: string; pid: string }> },
  ) => putKhataPayment(req, context, office),
  DELETE: (
    req: Request,
    context: { params: Promise<{ id: string; pid: string }> },
  ) => deleteKhataPayment(req, context, office),
});

export const { PUT, DELETE } = createKhataPaymentDetailHandlers("lahore");
