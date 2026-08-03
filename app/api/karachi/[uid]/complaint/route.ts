import pool from "@/config/db"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params
  const searchParams = new URL(req.url).searchParams
  const start_date = searchParams.get("start_date")
  const end_date = searchParams.get("end_date")

  try {
    const isAdmin = await checkSuperadmin(uid)
    const queryParams = []
    let query = ""

    const userQuery = await pool.query(
      `SELECT id, designation, complaint_assigned FROM users WHERE id = $1`,
      [uid]
    )
    const user = userQuery.rows[0]

    if (!user?.id) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.complaint_assigned || isAdmin) {
      query = `
        SELECT 
          c.*,
          c.id AS complaint_id,
          c.title AS complaint_title,
          c.problem AS complaint_problem,
          c.solution AS complaint_solution,
          c.status AS complaint_status,
          c.paid AS complaint_paid,
          c.installation AS complaint_installation,
          c.charges AS complaint_charges,
          c.created_at AS complaint_created_at,
          c.customer_id,
          cu.name AS customer_name,
          cu.address AS customer_address,
          cu.location AS customer_location,
          cu.owner AS customer_owner,
          cu.number AS customer_number,
          cu.pin AS customer_pin,
          cu.ownership AS customer_ownership_id,
          owner_user.name AS customer_ownership_name,
          ca.id AS assignment_id,
          ca.engineer_id,
          engineer.name AS engineer_name,
          ca.assigned_by,
          assigned_by_user.name AS assigned_by_name,
          ca.created_at AS assignment_created_at,
          COALESCE((
            SELECT json_agg(cl)
            FROM (
              SELECT remark, location, created_at, signature, image
              FROM complaint_logs
              WHERE complaint_id = c.id
              ORDER BY created_at DESC
            ) cl
          ), '[]') AS logs,
          COALESCE((
  SELECT json_agg(cp)
  FROM (
    SELECT
      id,
      complaint_id,
      amount,
      purpose,
      method,
      slip,
      created_at
    FROM complaint_payments
    WHERE complaint_id = c.id
    ORDER BY created_at DESC
  ) cp
), '[]') AS payment_details
        FROM complaints c
        LEFT JOIN customer cu ON c.customer_id = cu.id
        LEFT JOIN users owner_user ON cu.ownership = owner_user.id
        
        LEFT JOIN LATERAL (
  SELECT *
  FROM complaint_assignments ca
  WHERE ca.complaint_id = c.id
  ORDER BY ca.created_at DESC
  LIMIT 1
) ca ON true
 
        LEFT JOIN users engineer ON ca.engineer_id = engineer.id
        LEFT JOIN users assigned_by_user ON ca.assigned_by = assigned_by_user.id
        WHERE c.customer_id IS NOT NULL AND c.managing_office = 'karachi'
      `

      if (start_date && end_date) {
        const paramIndex = queryParams.length + 1
        query += ` AND c.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        queryParams.push(start_date, end_date)
      }

      query += ` ORDER BY c.created_at DESC`
    } else {
      if (user.designation === "Engineer") {
        query = `
        SELECT 
          ca.*,
           c.id AS complaint_id,
          c.title AS complaint_title,
          c.problem AS complaint_problem,
          c.solution AS complaint_solution,
          c.status AS complaint_status,
          c.paid AS complaint_paid,
          c.category AS complaint_category,
          c.installation AS complaint_installation,
          c.charges AS complaint_charges,
          c.created_at AS complaint_created_at,
          cu.name AS customer_name,
          cu.address AS customer_address,
          cu.location AS customer_location,
          cu.owner AS customer_owner,
          cu.number AS customer_number,
          cu.pin AS customer_pin,
          cu.ownership AS customer_ownership_id,
          owner_user.name AS customer_ownership_name,
          au.name AS assigned_by_name
        FROM complaint_assignments ca
        JOIN complaints c ON ca.complaint_id = c.id
        LEFT JOIN users au ON ca.assigned_by = au.id
        LEFT JOIN customer cu ON c.customer_id = cu.id
        LEFT JOIN users owner_user ON cu.ownership = owner_user.id
        WHERE ca.engineer_id = $1 AND c.status != 'completed'
      `
        queryParams.push(uid)

        if (start_date && end_date) {
          const paramIndex = queryParams.length + 1
          query += ` AND c.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`
          queryParams.push(start_date, end_date)
        }

        query += ` ORDER BY c.created_at DESC`
      } else if (user.designation === "Sales") {
        query = `
        SELECT 
          c.title AS complaint_title,
          c.problem AS complaint_problem,
          c.solution AS complaint_solution,
          c.status AS complaint_status,
          c.created_at AS complaint_created_at,
          c.customer_id,
          c.id AS complaint_id,
          cu.name AS customer_name,
          cu.address AS customer_address,
          cu.location AS customer_location,
          cu.owner AS customer_owner,
          cu.number AS customer_number,
          cu.pin AS customer_pin,
          cu.ownership AS customer_ownership_id,
          owner_user.name AS customer_ownership_name,
          ca.id AS assignment_id,
          ca.engineer_id,
          engineer.name AS engineer_name,
          ca.assigned_by,
          assigned_by_user.name AS assigned_by_name,
          ca.created_at AS assignment_created_at 
        FROM complaints c
        LEFT JOIN customer cu ON c.customer_id = cu.id
        LEFT JOIN users owner_user ON cu.ownership = owner_user.id
        LEFT JOIN LATERAL (
  SELECT *
  FROM complaint_assignments
  WHERE complaint_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) ca ON true
        LEFT JOIN users engineer ON ca.engineer_id = engineer.id
        LEFT JOIN users assigned_by_user ON ca.assigned_by = assigned_by_user.id
        WHERE cu.ownership = $1
      `
        queryParams.push(uid)

        if (start_date && end_date) {
          const paramIndex = queryParams.length + 1
          query += ` AND c.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`
          queryParams.push(start_date, end_date)
        }

        query += ` ORDER BY c.created_at DESC`
      } else {
        return NextResponse.json(
          { message: "No data to display" },
          { status: 404 }
        )
      }
    }
    const result = await pool.query(query, queryParams)
    return NextResponse.json(result.rows, { status: 200 })
  } catch (error: any) {
    console.log(error)
    return NextResponse.json(
      { message: error.message || "Error occured" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  try {
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
    INSERT INTO complaints (${fields.join(", ")})
    VALUES (${placeholders})
    RETURNING *
`

    const { rows } = await pool.query(query, values)
    return NextResponse.json(rows[0], { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error occured" },
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
            UPDATE complaints 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `

    await pool.query(query, values)

    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating inventory data:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
