import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { field } = await req.json()

  try {
    const query = await pool.query(
      `
  UPDATE issueditems_karachi SET received = $1, receiving_date = $2 WHERE id = $3
`,
      [true, new Date(), id]
    )

    for (const item of field) {
      const { id: itemId, qty } = item
      await pool.query(
        `UPDATE inventory_karachi SET qty = qty + $1 WHERE id = $2`,
        [qty, itemId]
      )
    }

    return NextResponse.json(query.rows, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Error" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
