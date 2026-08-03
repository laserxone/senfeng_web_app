import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params

  try {
    await pool.query("DELETE FROM todos WHERE user_id = $1 AND is_done = $2", [
      uid,
      true,
    ])
    return NextResponse.json({ message: "Done" }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}
