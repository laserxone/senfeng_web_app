import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const user_id = searchParams.get("id")

  if (!user_id) {
    return NextResponse.json({ message: "User missing" }, { status: 400 })
  }

  try {
    const query = await pool.query(
      `SELECT 
      c.id, 
      c.name, 
      c.owner, 
      c.ownership,
      c.location,
      u.name AS ownership_name 
      FROM customer c
      LEFT JOIN users u ON u.id  = c.ownership 
       WHERE c.ownership = $1
      `,
      [user_id]
    )

    return NextResponse.json(query.rows, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { from_user_id, to_user_id, ids } = await req.json()

    if (!from_user_id || !to_user_id || !ids) {
      return NextResponse.json(
        { message: "Parameters missing" },
        { status: 400 }
      )
    }

    await pool.query(
      `UPDATE customer SET ownership = $1 WHERE id = ANY($2::int[])`,
      [to_user_id, ids]
    )

    return NextResponse.json({ message: "Transfer completed" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  }
}
