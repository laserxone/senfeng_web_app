import pool from "@/config/db"
import DeleteStorageBackend from "@/lib/delete-storage-backend"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 })
    }
    const imageQuery = await pool.query(
      `SELECT image FROM reimbursement WHERE id = $1`,
      [id]
    )
    const image = imageQuery.rows[0]?.image ?? null
    await DeleteStorageBackend(image)

    await pool.query(`DELETE FROM reimbursement WHERE id = $1`, [id])

    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await req.json()
    const { ...updates } = data
    const { id } = await params

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
          UPDATE reimbursement 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `

    await pool.query(query, values)

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

export const revalidate = 0
