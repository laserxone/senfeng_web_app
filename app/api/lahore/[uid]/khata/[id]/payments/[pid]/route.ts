import pool from "@/config/db"
import { NextResponse } from "next/server"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pid: string }> }
) {
  const { pid: paymentId } = await params
  const body = await req.json()

  console.log(body)

  const { amount, date, remarks, tid } = body

  const result = await pool.query(
    `
    UPDATE khata_payments
    SET amount = $1,
        date = $2,
        remarks = $3,
        tid = $4
    WHERE id = $5
    RETURNING *
    `,
    [amount, date, remarks, tid, paymentId]
  )

  return NextResponse.json(result.rows[0])
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pid: string }> }
) {
  const { pid: paymentId } = await params

  await pool.query(
    `
    DELETE FROM khata_payments
    WHERE id = $1
    `,
    [paymentId]
  )

  return NextResponse.json({ success: true })
}
