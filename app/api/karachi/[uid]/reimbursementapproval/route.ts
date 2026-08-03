import pool from "@/config/db"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
import UploadImageForMobile from "@/lib/uploadImageForMobile"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const searchParams = req.nextUrl.searchParams
  const start_date = searchParams.get("start_date")
  const end_date = searchParams.get("end_date")
  const user = searchParams.get("user")

  try {
    let query = `
  SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS submitted_by_name,
    c.id AS customer_id,
    c.member AS customer_member,
    c.ownership AS ownership_id,
    COALESCE(c.name, c.owner) AS customer,
    o.name AS ownership_name
  FROM reimbursement r
  INNER JOIN users u ON r.submitted_by = u.id
  LEFT JOIN customer c ON c.id = r.customer_id
  LEFT JOIN users o ON o.id = c.ownership
  WHERE u.office = 'karachi' AND r.verified IS FALSE
`

    const queryParams = []

    if (start_date && end_date) {
      query += ` AND r.date BETWEEN $1 AND $2`
      queryParams.push(start_date, end_date)
    }

    if (user) {
      query += queryParams.length ? ` AND` : ` WHERE`
      query += ` submitted_by = $${queryParams.length + 1}`
      queryParams.push(user)
    }

    query += ` ORDER BY r.date DESC;`

    const result = await pool.query(query, queryParams)
    const reimbursements = result.rows

    for (const reimbursement of reimbursements) {
      if (!reimbursement.purpose) {
        const title = reimbursement.title

        const customerQuery = `
      SELECT id, ownership, member 
      FROM customer 
      WHERE name ILIKE $1 OR owner ILIKE $1
      LIMIT 1;
    `
        const customerRes = await pool.query(customerQuery, [`%${title}%`])

        if (customerRes.rows.length > 0) {
          const customer = customerRes.rows[0]
          reimbursement.customer_id = customer.id
          reimbursement.customer_member = customer.member
          reimbursement.customer = reimbursement.title
          reimbursement.ownership_id = customer.ownership

          const ownerQuery = `SELECT name FROM users WHERE id = $1 LIMIT 1;`
          const ownerRes = await pool.query(ownerQuery, [customer.ownership])

          if (ownerRes.rows.length > 0) {
            reimbursement.ownership_name = ownerRes.rows[0].name
          } else {
            reimbursement.ownership_name = null
          }
        } else {
          reimbursement.customer_id = null
          reimbursement.ownership_id = null
          reimbursement.ownership_name = null
        }
      }
    }

    return NextResponse.json(reimbursements, { status: 200 })
  } catch (error: any) {
    console.error("Error inserting data: ", error)
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
