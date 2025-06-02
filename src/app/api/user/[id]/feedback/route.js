import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        let query = `
        SELECT 
  feedback.id,
  feedback.customer_id,
  feedback.created_at AS feedback_date,
  feedback.status,
  feedback.feedback,
  customer.id AS customer_id,
  customer.name,
  customer.owner,
  customer.location,
  customer.number
FROM feedback
LEFT JOIN customer ON feedback.customer_id = customer.id
WHERE feedback.user_id = $1
`
        const queryParams = [id]

        if (start_date && end_date) {
            query += ` AND feedback.created_at BETWEEN $2 AND $3
`
            queryParams.push(start_date, end_date)
        }
        query += ` ORDER BY feedback.created_at ASC;`

        const result = await pool.query(query, queryParams)
        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error?.message || "Failed to fetch data" }, { status: 500 })
    }
}

export const revalidate = 0