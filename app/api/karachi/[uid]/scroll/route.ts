import pool from "@/config/db"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params

    const isAdmin = await checkSuperadmin(uid)

    if (isAdmin) {
      const result = await pool.query(
        `SELECT id, name, owner, location, member FROM customer`
      )

      return NextResponse.json(result.rows, { status: 200 })
    } else {
      const condition = await pool.query(
        `SELECT designation, limited_access FROM users WHERE id = $1`,
        [uid]
      )

      const user = condition.rows[0]
      let result: any = null

      if (!user) {
        return NextResponse.json(
          { message: "User note found" },
          { status: 500 }
        )
      }

      if (user.limited_access) {
        if (
          user.designation === "Customer Relationship Manager" ||
          user.designation === "Customer Relationship Manager (After Sales)" ||
          user.designation === "Social Media Manager"
        ) {
          result = await pool.query(
            `SELECT id, name, owner, location, member FROM customer WHERE lead = $1`,
            [uid]
          )
        } else if (
          user.designation === "Sales" ||
          user.designation === "Engineer"
        ) {
          result = await pool.query(
            `SELECT id, name, owner, location, member FROM customer WHERE ownership = $1`,
            [uid]
          )
        }
      } else {
        result = await pool.query(
          `SELECT id, name, owner, location, member FROM customer`
        )
      }

      return NextResponse.json(result.rows, { status: 200 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
