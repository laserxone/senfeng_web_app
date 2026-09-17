import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { sendNotification } from "@/lib/sendNotification";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    data.managing_office = "karachi";

    if (
      data.priority &&
      !["normal", "urgent", "critical"].includes(data.priority)
    ) {
      return NextResponse.json(
        { message: "Invalid priority" },
        { status: 400 },
      );
    }

    if (data.parts_receiving_id) {
      const receipt = await pool.query(
        `SELECT id, customer_id
         FROM parts_receiving
         WHERE id = $1 AND managing_office = 'karachi'`,
        [data.parts_receiving_id],
      );

      if (!receipt.rows[0]) {
        return NextResponse.json(
          { message: "Parts receipt not found" },
          { status: 404 },
        );
      }

      if (Number(receipt.rows[0].customer_id) !== Number(data.customer_id)) {
        return NextResponse.json(
          {
            message: "Lab task customer must match the selected parts receipt",
          },
          { status: 400 },
        );
      }

      const activeTask = await pool.query(
        `SELECT id
         FROM lab_tasks
         WHERE parts_receiving_id = $1
           AND managing_office = 'karachi'
           AND COALESCE(status, 'pending') <> 'completed'
         LIMIT 1`,
        [data.parts_receiving_id],
      );
      if (activeTask.rows[0]) {
        return NextResponse.json(
          { message: "This parts receipt already has an active lab task" },
          { status: 409 },
        );
      }
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
        INSERT INTO lab_tasks (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

    await pool.query(query, values);

    sendNotification(
      data?.remarks,
      `dashboard?p=repair`,
      data?.user_id,
      NOTIFICATION_TYPES.repairing_assigned.title,
      NOTIFICATION_TYPES.repairing_assigned.category,
    );

    console.log("data inserted successfully");
    return NextResponse.json(
      {
        message: "Data saved",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: "Error adding customer" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{}> },
) {
  const searchParams = req.nextUrl.searchParams;
  const user = searchParams.get("user");

  let queryParams = [];
  try {
    let query = `
   SELECT
    lt.*,
    u.name AS user_name,
    c.name AS customer_name,
    o.name AS owner_name,
    pr.part_name AS received_part_name,
    pr.part_model AS received_part_model,
    pr.part_qty AS received_part_qty,
    pr.part_problem AS received_part_problem,
    pr.part_img AS received_part_img,
    pr.warranty_status AS received_part_warranty_status,
    pr.receiving_date,
    COALESCE(payment_totals.approved_payment_total, 0) AS approved_payment_total,
    GREATEST(
      COALESCE(lt.charges::numeric, 0) - COALESCE(payment_totals.approved_payment_total, 0),
      0
    ) AS remaining_balance
FROM lab_tasks lt
LEFT JOIN users u ON u.id = lt.user_id
LEFT JOIN customer c ON c.id = lt.customer_id
LEFT JOIN users o ON o.id = c.ownership
LEFT JOIN parts_receiving pr ON pr.id = lt.parts_receiving_id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS approved_payment_total
  FROM lab_task_payments
  WHERE lab_task_id = lt.id
) payment_totals ON TRUE
WHERE lt.managing_office = 'karachi'
  `;

    if (user) {
      query += " AND u.id = $1";
      queryParams.push(user);
    }
    query += " ORDER BY lt.assign_date DESC";

    const result = await pool.query(query, queryParams);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error("Error ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
