import pool from "@/config/db"
import admin from "@/lib/firebaseAdmin"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pid: string }> }
) {
  try {
    const { pid } = await params

    if (!pid) {
      return NextResponse.json(
        { message: "Payment ID is required." },
        { status: 400 }
      )
    }

    const res = await pool.query(
      `SELECT slip FROM complaint_payments WHERE id = $1`,
      [pid]
    )
    const data = res.rows?.[0] ?? null

    if (!data) {
      return NextResponse.json({ message: "Data not found" }, { status: 400 })
    }

    const bucket = admin.storage().bucket()

    if (data?.slip) {
      try {
        await bucket.file(data?.slip).delete()
      } catch (error) {
        console.error("Storage delete error:", error)
      }
    }

    await pool.query(`DELETE FROM complaint_payments WHERE id = $1`, [pid])

    return NextResponse.json({
      message: "Payment deleted successfully.",
    })
  } catch (error) {
    console.error("Delete payment error:", error)

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    )
  }
}
