import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 }
      )
    }

    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ")

    const query = `
        INSERT INTO customer_parts (${fields.join(", ")})
        VALUES (${placeholders})
    `

    await pool.query(query, values)
    const { part_id } = data
    await pool.query(
      `UPDATE savedinvoices SET 
                payment = $1
             WHERE id = $2`,
      [true, part_id]
    )

    return NextResponse.json(
      {
        message: "Payment added successfully",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error inserting data: ", error)
    return NextResponse.json(
      { message: error?.message || "Error adding payment" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, ...updates } = data

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
            UPDATE customer_parts 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `

    await pool.query(query, values)

    console.log("data updated successfully")
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
