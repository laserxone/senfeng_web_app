import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params
  const searchParams = req.nextUrl.searchParams
  const office = "lahore"
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  try {
    const [userResult] = await Promise.all([
      pool.query(
        "SELECT id, dp, name, designation, limited_access, reimbursement_approval FROM users WHERE id = $1",
        [uid]
      ),
    ])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]
    const customersResult = await pool.query(`
  SELECT
    c.id,
    c.name,
    c.location,
    c.number,
    c.owner,
    c.member,
    c.created_at
  FROM customer c
  WHERE c.office = 'lahore'
    AND (
      c.member IS TRUE
      OR EXISTS (
        SELECT 1
        FROM sale s
        WHERE s.customer_id = c.id
      )
    )
  ORDER BY c.created_at DESC
`)

    const customers = customersResult.rows

    const feedbackResult = await pool.query(
      `
    SELECT DISTINCT ON (f.customer_id)
        f.customer_id,
        f.created_at,
        f.status,
         u.name AS user_name
    FROM feedback f
    INNER JOIN users u ON u.id = f.user_id
    WHERE u.designation = 'Customer Relationship Manager (After Sales)'
      AND LOWER(u.office) = LOWER($1)
      AND f.created_at BETWEEN $2 AND $3
    ORDER BY f.customer_id, f.created_at DESC
    `,
      ["lahore", start, end]
    )

    const feedbackMap = new Map(
      feedbackResult.rows.map((row) => [
        row.customer_id,
        {
          feedback_date: row.created_at,
          user_name: row.user_name,
          feedback_status: row.status,
        },
      ])
    )

    const customersWithFeedback = []
    const customersWithoutFeedback = []

    for (const customer of customers) {
      const feedbackInfo = feedbackMap.get(customer.id)

      if (feedbackInfo) {
        customersWithFeedback.push({
          ...customer,
          feedback_date: feedbackInfo.feedback_date,
          user_name: feedbackInfo.user_name,
          feedback_status: feedbackInfo.feedback_status,
        })
      } else {
        customersWithoutFeedback.push(customer)
      }
    }

    const allTasksQueryResult = await pool.query(
      `SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending' AND created_at BETWEEN $2 AND $3`,
      [uid, start, end]
    )

    return {
      withFeedback: customersWithFeedback,
      withoutFeedback: customersWithoutFeedback,
      allTasks: allTasksQueryResult.rows.length,
    }
  } catch (error: any) {
    console.log(error)
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  }
}
