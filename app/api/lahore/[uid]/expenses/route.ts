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
        INSERT INTO branchexpenses (${fields.join(", ")})
        VALUES (${placeholders})
    `

    await pool.query(query, values)

    console.log("data inserted successfully")
    return NextResponse.json(
      { message: "Inserted successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error inserting data: ", error)
    return NextResponse.json(
      { message: "Error adding customer" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const start_date = searchParams.get("start_date")
  const end_date = searchParams.get("end_date")

  const office = "lahore"

  try {
    let query = `
    SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS submitted_by_name
FROM branchexpenses r
INNER JOIN users u ON r.submitted_by = u.id
 WHERE u.office = $1
    `

    const queryParams = [office]

    if (start_date && end_date) {
      query += ` AND r.date BETWEEN $2 AND $3`
      queryParams.push(start_date, end_date)
    }
    query += ` ORDER BY r.date DESC;`
    const result = await pool.query(query, queryParams)
    return NextResponse.json(result.rows, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching data: ", error)
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
