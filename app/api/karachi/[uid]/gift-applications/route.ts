import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { sendNotification } from "@/lib/sendNotification";
import { NextRequest, NextResponse } from "next/server";

const selectApplications = (where = "", params: unknown[] = []) =>
  pool.query(
    `SELECT ga.*, u.name AS user_name, u.designation AS user_designation, ah.name AS hierarchy_name, c.name AS customer_name, c.owner AS customer_owner,
    COALESCE((SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'qty', requested.qty, 'available_qty', i.qty) ORDER BY i.name) FROM jsonb_to_recordset(ga.inventory_items) AS requested(id integer, qty numeric) JOIN inventory_karachi i ON i.id = requested.id), '[]'::json) AS inventory_details,
    json_agg(json_build_object('id', gap.id, 'approver_id', gap.approver_id, 'approval_order', gap.approval_order, 'status', gap.status, 'comments', gap.comments, 'acted_at', gap.acted_at, 'approver_name', au.name, 'approver_designation', au.designation) ORDER BY gap.approval_order) FILTER (WHERE gap.id IS NOT NULL) AS approval_steps
  FROM gift_applications ga JOIN users u ON ga.user_id = u.id LEFT JOIN customer c ON ga.customer_id = c.id LEFT JOIN approval_hierarchies ah ON ga.hierarchy_id = ah.id LEFT JOIN gift_approvals gap ON ga.id = gap.gift_application_id LEFT JOIN users au ON gap.approver_id = au.id ${where}
  GROUP BY ga.id, u.name, u.designation, ah.name, c.name, c.owner ORDER BY ga.created_at DESC`,
    params,
  );

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const approverId = searchParams.get("approver_id");
    if (userId)
      return NextResponse.json(
        (await selectApplications("WHERE ga.user_id = $1", [Number(userId)]))
          .rows,
      );
    if (approverId) {
      const id = Number(approverId);
      const rows = (
        await selectApplications(
          "WHERE EXISTS (SELECT 1 FROM gift_approvals g WHERE g.gift_application_id = ga.id AND g.approver_id = $1)",
          [id],
        )
      ).rows;
      return NextResponse.json(
        rows.map((application) => ({
          ...application,
          is_my_turn:
            application.status === "in_progress" &&
            application.approval_steps?.some(
              (step: {
                approver_id: number;
                approval_order: number;
                status: string;
              }) =>
                step.approver_id === id &&
                step.approval_order === application.current_approver_order &&
                step.status === "pending",
            ),
          my_approval_status:
            application.approval_steps?.find(
              (step: { approver_id: number; status: string }) =>
                step.approver_id === id && step.status !== "pending",
            )?.status ?? null,
        })),
      );
    }
    return NextResponse.json((await selectApplications()).rows);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch gift applications" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const {
      user_id,
      customer_id,
      inventory_items,
      reason,
      image,
      hierarchy_id,
    } = await request.json();
    if (
      !user_id ||
      !customer_id ||
      !Array.isArray(inventory_items) ||
      !inventory_items.length ||
      !reason ||
      !hierarchy_id
    )
      return NextResponse.json(
        {
          message:
            "User, customer, inventory items, reason, and hierarchy are required",
        },
        { status: 400 },
      );
    const hierarchy = await client.query(
      "SELECT id FROM approval_hierarchies WHERE id = $1 AND hierarchy_type = 'gift'",
      [hierarchy_id],
    );
    if (!hierarchy.rows[0]) {
      return NextResponse.json(
        { message: "A valid gift approval hierarchy is required" },
        { status: 400 },
      );
    }
    const requestedItems = inventory_items.map((item: unknown) => {
      const value = item as { id?: unknown; qty?: unknown };
      return { id: Number(value.id), qty: Number(value.qty) };
    });
    if (
      requestedItems.some(
        (item) =>
          !Number.isInteger(item.id) ||
          item.id <= 0 ||
          !Number.isFinite(item.qty) ||
          item.qty <= 0,
      )
    )
      return NextResponse.json(
        { message: "Each inventory item must have a valid ID and quantity" },
        { status: 400 },
      );
    if (
      new Set(requestedItems.map((item) => item.id)).size !==
      requestedItems.length
    )
      return NextResponse.json(
        { message: "Each inventory item can only be selected once" },
        { status: 400 },
      );
    const stock = await client.query(
      "SELECT id, qty FROM inventory_karachi WHERE id = ANY($1::int[])",
      [requestedItems.map((item) => item.id)],
    );
    const available = new Map(
      stock.rows.map((item) => [Number(item.id), Number(item.qty)]),
    );
    const invalidItem = requestedItems.find(
      (item) =>
        !available.has(item.id) || item.qty > (available.get(item.id) || 0),
    );
    if (invalidItem)
      return NextResponse.json(
        {
          message:
            "One or more requested inventory quantities exceed the available stock",
        },
        { status: 400 },
      );
    const approvers = await client.query(
      "SELECT user_id, approval_order FROM hierarchy_approvers WHERE hierarchy_id = $1 ORDER BY approval_order",
      [hierarchy_id],
    );
    if (!approvers.rows.length) {
      return NextResponse.json(
        {
          message:
            "The selected gift hierarchy must have at least one approver",
        },
        { status: 400 },
      );
    }
    await client.query("BEGIN");
    const {
      rows: [application],
    } = await client.query(
      "INSERT INTO gift_applications (user_id, customer_id, inventory_items, reason, image, hierarchy_id, status, current_approver_order) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 1) RETURNING *",
      [
        user_id,
        customer_id,
        JSON.stringify(requestedItems),
        reason,
        image || null,
        hierarchy_id,
      ],
    );
    for (const approver of approvers.rows)
      await client.query(
        "INSERT INTO gift_approvals (gift_application_id, approver_id, approval_order, status) VALUES ($1, $2, $3, 'pending')",
        [application.id, approver.user_id, approver.approval_order],
      );
    await client.query(
      "UPDATE gift_applications SET status = 'in_progress' WHERE id = $1",
      [application.id],
    );
    const {
      rows: [applicant],
    } = await client.query("SELECT name FROM users WHERE id = $1", [user_id]);
    await sendNotification(
      `${applicant?.name || "A user"} submitted a gift application requesting your approval`,
      `applications/gift?g=${application.id}`,
      approvers.rows[0].user_id,
      NOTIFICATION_TYPES.gift_applied.title,
      NOTIFICATION_TYPES.gift_applied.category,
    );
    await client.query("COMMIT");
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { message: "Failed to create gift application" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
