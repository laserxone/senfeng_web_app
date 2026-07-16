import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { approver_id, action, comments } = body;

    if (!approver_id || !action) {
      return NextResponse.json(
        { error: "Approver ID and action are required" },
        { status: 400 }
      );
    }

    let applicantID = null;
    let approverID = null;

    const applicationId = parseInt(id);

    const applicationRes = await pool.query(
      `SELECT * FROM backup_applications WHERE id = $1`,
      [applicationId]
    );

    const application = applicationRes.rows[0];

    if (!application) {
      return NextResponse.json(
        { error: "Backup application not found" },
        { status: 404 }
      );
    }

    applicantID = application.user_id;

    const userRes = await pool.query(
      `SELECT designation, full_access FROM users WHERE id = $1`,
      [approver_id]
    );

    const user = userRes.rows[0];
    const isAdmin = user?.designation === "Owner" || user?.full_access === true;

    const currentApprovalRes = await pool.query(
      `
      SELECT * FROM backup_approvals
      WHERE backup_application_id = $1
        AND approver_id = $2
        AND status = 'pending'
        AND approval_order = $3
      `,
      [applicationId, approver_id, application.current_approver_order]
    );

    const currentApproval = currentApprovalRes.rows[0];

    // ================= ADMIN FALLBACK =================
    if (!currentApproval) {
      if (isAdmin) {
        const pendingRes = await pool.query(
          `
          SELECT * FROM backup_approvals
          WHERE backup_application_id = $1
            AND status = 'pending'
            AND approval_order = $2
          `,
          [applicationId, application.current_approver_order]
        );

        const pendingApproval = pendingRes.rows[0];

        if (pendingApproval) {
          await pool.query(
            `
            UPDATE backup_approvals
            SET status = $1,
                comments = $2,
                acted_at = CURRENT_TIMESTAMP
            WHERE id = $3
            `,
            [
              action,
              comments ? `[Admin] ${comments}` : "[Admin Override]",
              pendingApproval.id,
            ]
          );

          if (action === "rejected") {
            await pool.query(
              `
              UPDATE backup_applications
              SET status = 'rejected',
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $1
              `,
              [applicationId]
            );
          } else if (action === "approved") {
            const nextRes = await pool.query(
              `
              SELECT * FROM backup_approvals
              WHERE backup_application_id = $1
                AND approval_order = $2
              `,
              [applicationId, application.current_approver_order + 1]
            );

            const nextApprover = nextRes.rows[0];

            if (nextApprover) {
              approverID = nextApprover.approver_id;

              await pool.query(
                `
                UPDATE backup_applications
                SET current_approver_order = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [application.current_approver_order + 1, applicationId]
              );
            } else {
              await pool.query(
                `
                UPDATE backup_applications
                SET status = 'approved',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                `,
                [applicationId]
              );
            }
          }

          await notify(action, applicantID, approverID, applicationId);

          return NextResponse.json({ success: true });
        }
      }

      return NextResponse.json(
        { error: "This backup application is not pending your approval" },
        { status: 400 }
      );
    }

    // ================= NORMAL APPROVAL =================
    await pool.query(
      `
      UPDATE backup_approvals
      SET status = $1,
          comments = $2,
          acted_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [action, comments || null, currentApproval.id]
    );

    if (action === "rejected") {
      await pool.query(
        `
        UPDATE backup_applications
        SET status = 'rejected',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [applicationId]
      );
    } else if (action === "approved") {
      const nextRes = await pool.query(
        `
        SELECT * FROM backup_approvals
        WHERE backup_application_id = $1
          AND approval_order = $2
        `,
        [applicationId, application.current_approver_order + 1]
      );

      const nextApprover = nextRes.rows[0];

      if (nextApprover) {
        approverID = nextApprover.approver_id;

        await pool.query(
          `
          UPDATE backup_applications
          SET current_approver_order = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [application.current_approver_order + 1, applicationId]
        );
      } else {
        await pool.query(
          `
          UPDATE backup_applications
          SET status = 'approved',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          `,
          [applicationId]
        );
      }
    }

    await notify(action, applicantID, approverID, applicationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing backup approval:", error);

    return NextResponse.json(
      { error: "Failed to process backup approval" },
      { status: 500 }
    );
  }
}

async function notify(
  action: string, applicantID: string, approverID: string, applicationId : number
) {
  if (action === "rejected") {
    await sendNotification(
      "Your backup application is rejected",
      `applications/backup?b=${applicationId}`,
      applicantID,
       NOTIFICATION_TYPES.backup_rejected.title,
       NOTIFICATION_TYPES.backup_rejected.category
    );
  }

  if (action === "approved" && approverID) {
    const nameQuery = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [applicantID]
    );

    const name = nameQuery.rows?.[0]?.name ?? "";

    sendNotification(
      `${name} submitted backup application requesting your approval`,
      `applications/backup?b=${applicationId}`,
      approverID,
      NOTIFICATION_TYPES.backup_applied.title,
       NOTIFICATION_TYPES.backup_applied.category
    );
  }

  if (action === "approved" && !approverID) {
     sendNotification(
      "Your backup application has been approved",
      `applications/backup?b=${applicationId}`,
      applicantID,
      NOTIFICATION_TYPES.backup_approved.title,
      NOTIFICATION_TYPES.backup_approved.category
    );
  }
}