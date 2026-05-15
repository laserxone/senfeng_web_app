import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    const office = "lahore"

    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")
    const queryParams = []
    let query = `
      SELECT
        u.id,
        u.name,
        u.designation,

        COUNT(ca.complaint_id)::int AS total_assigned,

        COUNT(
          CASE 
            WHEN LOWER(c.status) IN ('resolved', 'completed') 
            THEN 1 
          END
        )::int AS total_completed,

        COUNT(
          CASE 
            WHEN LOWER(c.status) NOT IN ('resolved', 'completed') 
            THEN 1 
          END
        )::int AS total_pending,

        ROUND(
          (
            COUNT(CASE WHEN LOWER(c.status) IN ('resolved', 'completed') THEN 1 END)::decimal
            / NULLIF(COUNT(ca.complaint_id), 0)
          ) * 100,
          2
        ) AS completion_rate

      FROM users u
      INNER JOIN complaint_assignments ca 
        ON ca.engineer_id = u.id
      INNER JOIN complaints c 
        ON c.id = ca.complaint_id
       WHERE u.office = 'lahore' 
     
    `
    if (start_date && end_date) {
        query += " AND c.created_at BETWEEN $1 AND $2"
        queryParams.push(start_date)
        queryParams.push(end_date)
    }

    query += `  GROUP BY u.id, u.name, u.designation
      ORDER BY completion_rate DESC, total_assigned DESC`
    try {
        const engineers = await pool.query(query, queryParams)

        const complaintsByCategory = await pool.query(`
  SELECT 
    CASE
      WHEN c.installation = true THEN 'New Installation'
      ELSE 'Complaint'
    END AS category,

    COUNT(*)::int AS total

  FROM complaints c

  INNER JOIN complaint_assignments ca 
    ON ca.complaint_id = c.id

  GROUP BY category
  ORDER BY total DESC
`);

        const complaintsByStatus = await pool.query(`
     SELECT
  CASE 
    WHEN LOWER(c.status) IN ('resolved', 'completed')
    THEN 'completed'
    ELSE 'pending'
  END AS status,

  COUNT(*)::int AS total

FROM complaints c

INNER JOIN complaint_assignments ca
  ON ca.complaint_id = c.id

GROUP BY
  CASE 
    WHEN LOWER(c.status) IN ('resolved', 'completed')
    THEN 'completed'
    ELSE 'pending'
  END
    `)

        const performanceTrend = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', c.created_at), 'Mon YYYY') AS month,

        COUNT(ca.complaint_id)::int AS total_assigned,

        COUNT(
          CASE 
            WHEN LOWER(c.status) IN ('resolved', 'completed') 
            THEN 1 
          END
        )::int AS total_completed,

        ROUND(
          (
            COUNT(CASE WHEN LOWER(c.status) IN ('resolved', 'completed') THEN 1 END)::decimal
            / NULLIF(COUNT(ca.complaint_id), 0)
          ) * 100,
          2
        ) AS completion_rate

      FROM complaints c
      INNER JOIN complaint_assignments ca 
        ON ca.complaint_id = c.id
      GROUP BY DATE_TRUNC('month', c.created_at)
      ORDER BY DATE_TRUNC('month', c.created_at)
    `);

        const totalAssigned = engineers.rows.reduce(
            (sum, item) => sum + Number(item.total_assigned),
            0
        );

        const totalCompleted = engineers.rows.reduce(
            (sum, item) => sum + Number(item.total_completed),
            0
        );

        const totalPending = engineers.rows.reduce(
            (sum, item) => sum + Number(item.total_pending),
            0
        );

        const completionRate =
            totalAssigned > 0
                ? Number(((totalCompleted / totalAssigned) * 100).toFixed(2))
                : 0;

        return NextResponse.json({
            success: true,

            overview: {
                total_assigned: totalAssigned,
                total_completed: totalCompleted,
                total_pending: totalPending,
                completion_rate: completionRate,
            },

            top_performers: engineers.rows.slice(0, 5).map((item) => ({
                engineer_id: item.id,
                name: item.name,
                designation: item.designation,
                total_assigned: Number(item.total_assigned),
                total_completed: Number(item.total_completed),
                total_pending: Number(item.total_pending),
                completion_rate: Number(item.completion_rate || 0),
            })),

            complaints_by_category: complaintsByCategory.rows.map((item) => ({
                category: item.category || "Uncategorized",
                total: Number(item.total),
            })),

            complaints_by_status: complaintsByStatus.rows.map((item) => ({
                status: item.status,
                total: Number(item.total),
            })),

            performance_trend: performanceTrend.rows.map((item) => ({
                month: item.month,
                total_assigned: Number(item.total_assigned),
                total_completed: Number(item.total_completed),
                completion_rate: Number(item.completion_rate || 0),
            })),

            task_overview: {
                completed: totalCompleted,
                pending: totalPending,
            },
        });
    } catch (error) {
        console.error("Engineer performance API error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch engineer performance data",
            },
            { status: 500 }
        );
    }
}