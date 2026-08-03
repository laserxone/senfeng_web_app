import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const searchParams = req.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  try {
    const customersResult = await pool.query(`
  SELECT
    c.id,
    c.name,
    c.location,
    c.number,
    c.owner,
    c.member,
    c.created_at,
    c.rating
  FROM customer c
  WHERE c.office = 'karachi'
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
        f.feedback,
         u.name AS user_name
    FROM feedback f
    INNER JOIN users u ON u.id = f.user_id
    WHERE u.designation = 'Customer Relationship Manager (After Sales)'
      AND LOWER(u.office) = LOWER($1)
      AND f.created_at BETWEEN $2 AND $3
    ORDER BY f.customer_id, f.created_at DESC
    `,
      ["karachi", start, end]
    )

    const feedbackMap = new Map(
      feedbackResult.rows.map((row) => [
        row.customer_id,
        {
          feedback_date: row.created_at,
          user_name: row.user_name,
          feedback_status: row.status,
          feedback: row.feedback,
        },
      ])
    )

    const previousFeedbackResult = await pool.query(
      `
  SELECT DISTINCT ON (f.customer_id)
    f.customer_id,
    f.feedback,
    f.created_at,
    f.status
  FROM feedback f
  WHERE f.created_at < $1
  ORDER BY f.customer_id, f.created_at DESC
  `,
      [start]
    )

    const previousFeedbackMap = new Map(
      previousFeedbackResult.rows.map((row) => [
        row.customer_id,
        {
          previous_feedback: row.feedback || "",
          previous_feedback_date: row.created_at || null,
          previous_feedback_status: row.status || "",
        },
      ])
    )

    const customersWithFeedback = []
    const customersWithoutFeedback = []

    for (const customer of customers) {
      const feedbackInfo = feedbackMap.get(customer.id)

      const previousInfo = previousFeedbackMap.get(customer.id) || {
        previous_feedback: "",
        previous_feedback_date: null,
        previous_feedback_status: "",
      }

      if (feedbackInfo) {
        customersWithFeedback.push({
          ...customer,
          ...previousInfo,
          feedback_date: feedbackInfo.feedback_date,
          user_name: feedbackInfo.user_name,
          feedback_status: feedbackInfo.feedback_status,
          feedback: feedbackInfo.feedback,
        })
      } else {
        customersWithoutFeedback.push({
          ...customer,
          ...previousInfo,
        })
      }
    }

    const responseData = {
      withFeedback: {
        total: customersWithFeedback.length,
        data: customersWithFeedback,
      },
      withoutFeedback: {
        data: customersWithoutFeedback,
        total: customersWithoutFeedback.length,
      },
      satisfied: customersWithFeedback.filter(
        (item) => item.feedback_status === "Satisfactory"
      ).length,
      unsatisfied: customersWithFeedback.filter(
        (item) => item.feedback_status !== "Satisfactory"
      ).length,
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.log(error)
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  }
}
