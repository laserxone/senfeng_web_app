import { NextResponse } from "next/server";
import pool from "@/config/db";

export async function POST(req) {
  const { loan_id, amount } = await req.json();
  try {
    // Insert payment
    await pool.query(`
      INSERT INTO employee_loan_payments (loan_id, amount)
      VALUES ($1, $2)
    `, [loan_id, amount]);

    // Update remaining_amount
    const loanRes = await pool.query(`SELECT remaining_amount FROM employee_loans WHERE id = $1`, [loan_id]);
    let remaining = parseFloat(loanRes.rows[0].remaining_amount) - parseFloat(amount);
    if (remaining < 0) remaining = 0;

    const status = remaining === 0 ? 'closed' : 'active';

    await pool.query(`
      UPDATE employee_loans
      SET remaining_amount = $1, status = $2
      WHERE id = $3
    `, [remaining, status, loan_id]);

    return NextResponse.json({ remaining_amount: remaining, status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
