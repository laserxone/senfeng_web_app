import pool from "@/config/db"
import deleteImageByPath from "@/lib/delete-image-by-path"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const client = await pool.connect()

  try {
    const { inv_id, fields } = await req.json()

    if (!inv_id) {
      return NextResponse.json(
        { message: "Invoice id is missing" },
        { status: 400 }
      )
    }

    await client.query("BEGIN")

    const partsQuery = await client.query(
      `SELECT id, image FROM customer_parts_karachi WHERE part_id = $1`,
      [inv_id]
    )

    const parts = partsQuery.rows

    if (fields?.length) {
      for (const item of fields) {
        const id = item?.id
        const qty = item?.qty || 0
        if (id) {
          await client.query(
            `UPDATE inventory_karachi SET qty = qty + $1 WHERE id = $2`,
            [qty, id]
          )
        }
      }
    }

    await client.query(
      `DELETE FROM customer_parts_karachi WHERE part_id = $1`,
      [inv_id]
    )

    await client.query(`DELETE FROM savedinvoices_karachi WHERE id = $1`, [
      inv_id,
    ])

    await client.query("COMMIT")

    for (const part of parts) {
      if (part.image) {
        await deleteImageByPath(part.image)
      }
    }

    return NextResponse.json(
      { message: "Invoice Deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    await client.query("ROLLBACK")

    console.log(error)

    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export const revalidate = 0
