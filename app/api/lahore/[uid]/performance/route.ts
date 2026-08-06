import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  const queryParams: any[] = [];

  let query = `
  SELECT
    u.id AS engineer_id,
    u.name,
    u.designation,
    u.dp,

    c.id AS complaint_id,
    c.status,
    c.installation,
    c.created_at

  FROM users u

  INNER JOIN complaint_assignments ca
    ON ca.engineer_id = u.id

  INNER JOIN complaints c
    ON c.id = ca.complaint_id

  WHERE u.office = 'lahore'
`;

  if (start_date && end_date) {
    query += ` AND c.created_at BETWEEN $1 AND $2`;
    queryParams.push(start_date, end_date);
  }

  query += ` ORDER BY c.created_at ASC`;

  try {
    const result = await pool.query(query, queryParams);
    const rows = result.rows;
    let previousRows: any[] = [];

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      const previousStartDate = new Date(startDate);
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);

      const previousEndDate = new Date(endDate);
      previousEndDate.setMonth(previousEndDate.getMonth() - 1);

      const previousResult = await pool.query(
        `
    SELECT
      c.id AS complaint_id,
      c.status
    FROM users u
    INNER JOIN complaint_assignments ca
      ON ca.engineer_id = u.id
    INNER JOIN complaints c
      ON c.id = ca.complaint_id
    WHERE u.office = 'lahore'
      AND c.created_at BETWEEN $1 AND $2
    `,
        [previousStartDate, previousEndDate],
      );

      previousRows = previousResult.rows;
    }

    const isCompleted = (status: string) => {
      return ["resolved", "completed"].includes(status?.toLowerCase());
    };

    const engineerMap = new Map();

    const categoryMap = {
      "New Installation": 0,
      Complaint: 0,
    };

    const statusMap = {
      completed: 0,
      pending: 0,
    };

    const trendMap = new Map();

    for (const row of rows) {
      const completed = isCompleted(row.status);
      const category = row.installation ? "New Installation" : "Complaint";
      const status = completed ? "completed" : "pending";

      if (!engineerMap.has(row.engineer_id)) {
        engineerMap.set(row.engineer_id, {
          engineer_id: row.engineer_id,
          name: row.name,
          dp: row.dp,
          designation: row.designation,
          total_assigned: 0,
          total_completed: 0,
          total_pending: 0,
        });
      }

      const engineer = engineerMap.get(row.engineer_id);

      engineer.total_assigned += 1;

      if (completed) {
        engineer.total_completed += 1;
      } else {
        engineer.total_pending += 1;
      }

      categoryMap[category] += 1;
      statusMap[status] += 1;

      const date = new Date(row.created_at);
      const month = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!trendMap.has(month)) {
        trendMap.set(month, {
          month,
          total_assigned: 0,
          total_completed: 0,
        });
      }

      const trend = trendMap.get(month);

      trend.total_assigned += 1;

      if (completed) {
        trend.total_completed += 1;
      }
    }

    const engineers = Array.from(engineerMap.values()).map((engineer) => {
      const completion_rate =
        engineer.total_assigned > 0
          ? Number(
              (
                (engineer.total_completed / engineer.total_assigned) *
                100
              ).toFixed(2),
            )
          : 0;

      return {
        ...engineer,
        completion_rate,
      };
    });

    const totalAssigned = engineers.reduce(
      (sum, item) => sum + item.total_assigned,
      0,
    );

    const totalCompleted = engineers.reduce(
      (sum, item) => sum + item.total_completed,
      0,
    );

    const totalPending = engineers.reduce(
      (sum, item) => sum + item.total_pending,
      0,
    );

    const completionRate =
      totalAssigned > 0
        ? Number(((totalCompleted / totalAssigned) * 100).toFixed(2))
        : 0;

    const maxAssigned = Math.max(
      ...engineers.map((item) => item.total_assigned),
      1,
    );

    const previousTotalAssigned = previousRows.length;

    const previousTotalCompleted = previousRows.filter((item) =>
      isCompleted(item.status),
    ).length;

    const previousTotalPending = previousTotalAssigned - previousTotalCompleted;

    const previousCompletionRate =
      previousTotalAssigned > 0
        ? Number(
            ((previousTotalCompleted / previousTotalAssigned) * 100).toFixed(2),
          )
        : 0;

    const topPerformers = engineers
      .map((engineer) => {
        const workload_score = Number(
          ((engineer.total_assigned / maxAssigned) * 100).toFixed(2),
        );

        const performance_score = Number(
          (engineer.completion_rate * 0.7 + workload_score * 0.3).toFixed(2),
        );

        return {
          ...engineer,
          workload_score,
          performance_score,
        };
      })
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 5);

    const complaintsByCategory = Object.entries(categoryMap).map(
      ([category, total]) => ({
        category,
        total,
      }),
    );

    const complaintsByStatus = Object.entries(statusMap).map(
      ([status, total]) => ({
        status,
        total,
      }),
    );

    const performanceTrend = Array.from(trendMap.values()).map((item) => ({
      month: item.month,
      total_assigned: item.total_assigned,
      total_completed: item.total_completed,
      completion_rate:
        item.total_assigned > 0
          ? Number(
              ((item.total_completed / item.total_assigned) * 100).toFixed(2),
            )
          : 0,
    }));

    return NextResponse.json({
      overview: {
        total_assigned: totalAssigned,
        total_assigned_change: getPercentageChange(
          totalAssigned,
          previousTotalAssigned,
        ),
        total_completed: totalCompleted,
        total_completed_change: getPercentageChange(
          totalCompleted,
          previousTotalCompleted,
        ),

        total_pending: totalPending,
        total_pending_change: getPercentageChange(
          totalPending,
          previousTotalPending,
        ),
        completion_rate: completionRate,
        completion_rate_change: getPercentageChange(
          completionRate,
          previousCompletionRate,
        ),
      },

      top_performers: topPerformers,

      complaints_by_category: complaintsByCategory,

      complaints_by_status: complaintsByStatus,

      performance_trend: performanceTrend,

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
      { status: 500 },
    );
  }
}

const getPercentageChange = (current: number, previous: number) => {
  if (previous === 0 && current === 0) {
    return {
      value: 0,
      positive: false,
    };
  }

  if (previous === 0 && current > 0) {
    return {
      value: 100,
      positive: true,
    };
  }

  const value = Number((((current - previous) / previous) * 100).toFixed(2));

  return {
    value: value,
    positive: value > 0,
  };
};
