import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { sendNotification } from "@/lib/sendNotification";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { approver_id, action, comments } = await request.json();
    if (!approver_id || !["approved", "rejected"].includes(action))
      return NextResponse.json(
        { error: "Approver ID and a valid action are required" },
        { status: 400 },
      );
    const applicationId = Number(id);
    const {
      rows: [application],
    } = await pool.query("SELECT * FROM gift_applications WHERE id = $1", [
      applicationId,
    ]);
    if (!application)
      return NextResponse.json(
        { error: "Gift application not found" },
        { status: 404 },
      );
    const {
      rows: [user],
    } = await pool.query(
      "SELECT designation, full_access FROM users WHERE id = $1",
      [approver_id],
    );
    const { rows: pending } = await pool.query(
      "SELECT * FROM gift_approvals WHERE gift_application_id = $1 AND approval_order = $2 AND status = 'pending'",
      [applicationId, application.current_approver_order],
    );
    const current = pending.find(
      (item) => Number(item.approver_id) === Number(approver_id),
    );
    if (
      !current &&
      !(user?.designation === "Owner" || user?.full_access === true)
    )
      return NextResponse.json(
        { error: "This gift application is not pending your approval" },
        { status: 400 },
      );
    const approval = current || pending[0];
    if (!approval)
      return NextResponse.json(
        { error: "This gift application has no pending approval" },
        { status: 400 },
      );
    await pool.query(
      "UPDATE gift_approvals SET status = $1, comments = $2, acted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [
        action,
        current
          ? comments || null
          : comments
            ? `[Admin] ${comments}`
            : "[Admin Override]",
        approval.id,
      ],
    );
    let nextApproverId: number | null = null;
    if (action === "rejected")
      await pool.query(
        "UPDATE gift_applications SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [applicationId],
      );
    else {
      const {
        rows: [next],
      } = await pool.query(
        "SELECT * FROM gift_approvals WHERE gift_application_id = $1 AND approval_order = $2",
        [applicationId, application.current_approver_order + 1],
      );
      if (next) {
        nextApproverId = next.approver_id;
        await pool.query(
          "UPDATE gift_applications SET current_approver_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [application.current_approver_order + 1, applicationId],
        );
      } else
        await pool.query(
          "UPDATE gift_applications SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [applicationId],
        );
    }
    const path = `applications/gift?g=${applicationId}`;
    if (action === "rejected")
      await sendNotification(
        "Your gift application is rejected",
        path,
        application.user_id,
        NOTIFICATION_TYPES.gift_rejected.title,
        NOTIFICATION_TYPES.gift_rejected.category,
      );
    else if (nextApproverId) {
      const {
        rows: [applicant],
      } = await pool.query("SELECT name FROM users WHERE id = $1", [
        application.user_id,
      ]);
      await sendNotification(
        `${applicant?.name || "A user"} submitted a gift application requesting your approval`,
        path,
        nextApproverId,
        NOTIFICATION_TYPES.gift_applied.title,
        NOTIFICATION_TYPES.gift_applied.category,
      );
    } else
      await sendNotification(
        "Your gift application has been approved",
        path,
        application.user_id,
        NOTIFICATION_TYPES.gift_approved.title,
        NOTIFICATION_TYPES.gift_approved.category,
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing gift approval:", error);
    return NextResponse.json(
      { error: "Failed to process gift approval" },
      { status: 500 },
    );
  }
}
