import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {
  const { id } = await params;

  try {
    const loanRes = await pool.query(`SELECT * FROM employee_loans WHERE id = $1`, [id]);
    const paymentsRes = await pool.query(`SELECT * FROM employee_loan_payments WHERE loan_id = $1 ORDER BY payment_date`, [id]);

    return NextResponse.json({
      loan: loanRes.rows[0],
      payments: paymentsRes.rows
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
