import { NextRequest, NextResponse } from "next/server"
import pool from "@/config/db"

export async function POST(req: NextRequest) {
  const { loan_id, amount } = await req.json()
  try {
    // Insert payment
    const val = await pool.query(
      `
      INSERT INTO employee_loan_payments (loan_id, amount)
      VALUES ($1, $2)
      RETURNING id
    `,
      [loan_id, amount]
    )

    // Update remaining_amount
    const loanRes = await pool.query(
      `SELECT remaining_amount FROM employee_loans WHERE id = $1`,
      [loan_id]
    )
    let remaining =
      parseFloat(loanRes.rows[0].remaining_amount) - parseFloat(amount)
    if (remaining < 0) remaining = 0

    const status = remaining === 0 ? "closed" : "active"

    await pool.query(
      `
      UPDATE employee_loans
      SET remaining_amount = $1, status = $2
      WHERE id = $3
    `,
      [remaining, status, loan_id]
    )

    return NextResponse.json({
      remaining_amount: remaining,
      status,
      id: val.rows[0]?.id,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const data = await req.json()
    const { id, ...updates } = data

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 })
    }

    const fields: string[] = []
    const values = []

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`)
        values.push(value)
      }
    })

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 }
      )
    }

    values.push(id)
    const query = `
          UPDATE employee_loan_payments 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `

    await pool.query(query, values)

    console.log("data updated successfully")
    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating data:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
