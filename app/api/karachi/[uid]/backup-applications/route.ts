import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { sendNotification } from "@/lib/sendNotification";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("user_id");
    const approverId = searchParams.get("approver_id");

    let result;

    if (userId) {
      result = await pool.query(
        `
        SELECT 
          ba.*,
          u.name as user_name,
          u.designation as user_designation,
          ah.name as hierarchy_name,
          c.name AS customer_name,
      c.owner AS customer_owner,
      s.order_no_arr,
      s.serial_no,
      c.id AS customer_id,
          json_agg(
            json_build_object(
              'id', bapp.id,
              'approver_id', bapp.approver_id,
              'approval_order', bapp.approval_order,
              'status', bapp.status,
              'comments', bapp.comments,
              'acted_at', bapp.acted_at,
              'approver_name', approver.name,
              'approver_designation', approver.designation
            ) ORDER BY bapp.approval_order
          ) FILTER (WHERE bapp.id IS NOT NULL) as approval_steps
        FROM backup_applications ba
        JOIN users u ON ba.user_id = u.id
        LEFT JOIN approval_hierarchies ah ON ba.hierarchy_id = ah.id
        LEFT JOIN backup_approvals bapp ON ba.id = bapp.backup_application_id
        LEFT JOIN users approver ON bapp.approver_id = approver.id
        LEFT JOIN sale s ON ba.sale_id = s.id
    LEFT JOIN customer c
      ON s.customer_id = c.id
        WHERE ba.user_id = $1
        GROUP BY ba.id, u.name, u.designation, ah.name,c.name,
      c.owner,
      c.id,
      s.order_no_arr, s.serial_no
        ORDER BY ba.created_at DESC
        `,
        [parseInt(userId)]
      );
    } else if (approverId) {
      const approverIdInt = parseInt(approverId);

      result = await pool.query(
        `
        SELECT 
          ba.*,
          u.name as user_name,
          u.designation as user_designation,
          ah.name as hierarchy_name,
          c.name AS customer_name,
      c.owner AS customer_owner,
      s.order_no_arr,
      s.serial_no,
      c.id AS customer_id,
          json_agg(
            json_build_object(
              'id', bapp.id,
              'approver_id', bapp.approver_id,
              'approval_order', bapp.approval_order,
              'status', bapp.status,
              'comments', bapp.comments,
              'acted_at', bapp.acted_at,
              'approver_name', approver.name,
              'approver_designation', approver.designation
            ) ORDER BY bapp.approval_order
          ) FILTER (WHERE bapp.id IS NOT NULL) as approval_steps,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM backup_approvals ba2
              WHERE ba2.backup_application_id = ba.id
                AND ba2.approver_id = $1
                AND ba2.approval_order = ba.current_approver_order
                AND ba2.status = 'pending'
                AND ba.status = 'in_progress'
            ) THEN true
            ELSE false
          END as is_my_turn,
          (
            SELECT ba3.status FROM backup_approvals ba3
            WHERE ba3.backup_application_id = ba.id
              AND ba3.approver_id = $1
              AND ba3.status != 'pending'
            LIMIT 1
          ) as my_approval_status
        FROM backup_applications ba
        JOIN users u ON ba.user_id = u.id
        LEFT JOIN approval_hierarchies ah ON ba.hierarchy_id = ah.id
        LEFT JOIN backup_approvals bapp ON ba.id = bapp.backup_application_id
        LEFT JOIN users approver ON bapp.approver_id = approver.id
        LEFT JOIN sale s ON ba.sale_id = s.id
        LEFT JOIN customer c
      ON s.customer_id = c.id
        WHERE EXISTS (
          SELECT 1 FROM backup_approvals ba_check
          WHERE ba_check.backup_application_id = ba.id
            AND ba_check.approver_id = $1
        )
        GROUP BY ba.id, u.name, u.designation, ah.name,
        c.name,
      c.owner,
      c.id,
      s.order_no_arr, s.serial_no
        ORDER BY 
          CASE WHEN ba.status = 'in_progress' THEN 0 ELSE 1 END,
          ba.created_at DESC
        `,
        [approverIdInt]
      );
    } else {
      result = await pool.query(`
        SELECT 
          ba.*,
          u.name as user_name,
          u.designation as user_designation,
          ah.name as hierarchy_name,
          json_agg(
            json_build_object(
              'id', bapp.id,
              'approver_id', bapp.approver_id,
              'approval_order', bapp.approval_order,
              'status', bapp.status,
              'comments', bapp.comments,
              'acted_at', bapp.acted_at,
              'approver_name', approver.name,
              'approver_designation', approver.designation
            ) ORDER BY bapp.approval_order
          ) FILTER (WHERE bapp.id IS NOT NULL) as approval_steps
        FROM backup_applications ba
        JOIN users u ON ba.user_id = u.id
        LEFT JOIN approval_hierarchies ah ON ba.hierarchy_id = ah.id
        LEFT JOIN backup_approvals bapp ON ba.id = bapp.backup_application_id
        LEFT JOIN users approver ON bapp.approver_id = approver.id
        GROUP BY ba.id, u.name, u.designation, ah.name
        ORDER BY ba.created_at DESC
      `);
    }

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.log("Error fetching backup applications:", error);

    return NextResponse.json(
      { message: error?.message || "Failed to fetch backup applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const body = await request.json();

    const {
      name,
      date_of_delivery,
      amount,
      shipment_name,
      image,
      expected_return_date,
      user_id,
      hierarchy_id,
       sale_id,
       backup_inventory_id
    } = body;

    const applicationResult = await client.query(
      `
      INSERT INTO backup_applications (
        name,
        date_of_delivery,
        amount,
        shipment_name,
        image,
        expected_return_date,
        user_id,
        hierarchy_id,
         sale_id,
         backup_inventory_id,
        status,
        issued,
        current_approver_order
        
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9, $10,'pending',false,1
      )
      RETURNING *
      `,
      [
        name,
        date_of_delivery || null,
        amount || null,
        shipment_name || null,
        image || null,
        expected_return_date || null,
        user_id,
        hierarchy_id || null,
        sale_id || null,
        backup_inventory_id || null
      ]
    );

    const application = applicationResult.rows[0];

    if (hierarchy_id) {
      const approversResult = await client.query(
        `
        SELECT user_id, approval_order
        FROM hierarchy_approvers
        WHERE hierarchy_id = $1
        ORDER BY approval_order
        `,
        [hierarchy_id]
      );

      for (const approver of approversResult.rows) {
        await client.query(
          `
          INSERT INTO backup_approvals (
            backup_application_id,
            approver_id,
            approval_order,
            status
          )
          VALUES ($1, $2, $3, 'pending')
          `,
          [
            application.id,
            approver.user_id,
            approver.approval_order,
          ]
        );
      }

      await client.query(
        `
        UPDATE backup_applications
        SET status = 'in_progress'
        WHERE id = $1
        `,
        [application.id]
      );

      if (approversResult.rows.length > 0) {
        const nameQuery = await client.query(
          `SELECT name FROM users WHERE id = $1`,
          [user_id]
        );

        const userName = nameQuery.rows?.[0]?.name || "";
        const sendTo = approversResult.rows?.[0]?.user_id ?? null;

         sendNotification(
          `${userName} submitted backup application requesting your approval`,
          `applications/backup?b=${application.id}`,
          sendTo,
          NOTIFICATION_TYPES.backup_applied.title,
          NOTIFICATION_TYPES.backup_applied.category,
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(application, {
      status: 201,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating backup application:", error);

    return NextResponse.json(
      { error: "Failed to create backup application" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}