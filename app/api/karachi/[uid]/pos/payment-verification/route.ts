import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, ...updates } = data

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 })
    }

    const fields: any[] = []
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
          UPDATE customer_parts_karachi 
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
