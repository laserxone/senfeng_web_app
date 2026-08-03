import pool from "@/config/db"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
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
        INSERT INTO fine (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `

    await pool.query(query, values)

    console.log("data inserted successfully")
    return NextResponse.json(
      {
        message: "Data saved",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error inserting data: ", error)
    return NextResponse.json(
      { message: "Error adding customer" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params
  const searchParams = req.nextUrl.searchParams
  const start_date = searchParams.get("start_date")
  const end_date = searchParams.get("end_date")
  const LIMIT = searchParams.get("LIMIT")
  const user = searchParams.get("user")

  try {
    const isAdmin = await checkSuperadmin(uid)

    if (isAdmin) {
      let query = `
    SELECT 
      f.*, 
      u.id AS user_id, 
      u.name AS user_name,
      c.id AS customer_id,
      c.name AS customer_name,
      c.owner AS customer_owner
    FROM fine f
    INNER JOIN users u ON f.user_id = u.id
    INNER JOIN customer c ON f.customer_id = c.id
  `

      const queryParams = []

      if (start_date && end_date) {
        query += ` AND f.created_at BETWEEN $1 AND $2`
        queryParams.push(start_date, end_date)
      }

      if (user) {
        query += queryParams.length ? ` AND` : ` WHERE`
        query += ` user_id = $${queryParams.length + 1}`
        queryParams.push(user)
      } else {
        query += queryParams.length ? ` AND` : ` WHERE`
        query += ` u.office = 'lahore'`
      }

      query += ` ORDER BY f.created_at DESC;`

      const result = await pool.query(query, queryParams)

      return NextResponse.json(result.rows, { status: 200 })
    } else {
      let query = `
          SELECT 
      f.*, 
      u.id AS user_id, 
      u.name AS user_name,
      c.id AS customer_id,
      c.name AS customer_name,
      c.owner AS customer_owner
    FROM fine f
    INNER JOIN users u ON f.user_id = u.id
    INNER JOIN customer c ON f.customer_id = c.id
    WHERE f.user_id = $1
      `

      const queryParams = [uid]

      if (start_date && end_date) {
        query += ` AND f.created_at BETWEEN $2 AND $3`
        queryParams.push(start_date, end_date)
      }

      if (LIMIT) {
        query += ` AND f.is_read IS FALSE ORDER BY f.created_at DESC LIMIT ${LIMIT}`
      } else {
        query += ` ORDER BY f.created_at DESC`
      }

      const result = await pool.query(query, queryParams)
      return NextResponse.json(result.rows, { status: 200 })
    }
  } catch (error: any) {
    console.error("Error ", error)
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
