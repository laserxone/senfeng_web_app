import pool from "@/config/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const query = await pool.query(`
  SELECT issueditems_karachi.*, users.name AS user_name
  FROM issueditems_karachi
  LEFT JOIN users ON issueditems_karachi.user_id = users.id
  WHERE issueditems_karachi.received IS false
`)

    return NextResponse.json(query.rows, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Error" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
