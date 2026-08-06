import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all loans with user info
    const loanResult = await pool.query(`
      SELECT l.*, u.name as user_name
      FROM employee_loans l
      JOIN users u ON u.id = l.user_id
      ORDER BY l.issued_date DESC
    `);

    const loans = loanResult.rows;

    // Get all payments for these loans
    const loanIds = loans.map((l) => l.id);
    let payments = [];
    if (loanIds.length > 0) {
      const paymentResult = await pool.query(
        `
        SELECT *
        FROM employee_loan_payments
        WHERE loan_id = ANY($1)
        ORDER BY payment_date ASC
      `,
        [loanIds],
      );
      payments = paymentResult.rows;
    }

    // Attach payments to each loan
    const loansWithPayments = loans.map((loan) => ({
      ...loan,
      payments: payments.filter((p) => p.loan_id === loan.id),
    }));

    return NextResponse.json(loansWithPayments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const { user_id, loan_amount, description } = await req.json();

  try {
    // Check if user already has an active loan
    const activeLoanCheck = await pool.query(
      `SELECT * FROM employee_loans WHERE user_id = $1 AND status = 'active'`,
      [user_id],
    );

    if (activeLoanCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "User already has an active loan" },
        { status: 400 },
      );
    }

    // Insert new loan
    const result = await pool.query(
      `
      INSERT INTO employee_loans (user_id, loan_amount, remaining_amount, description)
      VALUES ($1, $2, $2, $3) RETURNING *
      `,
      [user_id, loan_amount, description],
    );

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
