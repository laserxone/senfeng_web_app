import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const approverId = Number(uid);

  if (!Number.isInteger(approverId)) {
    return NextResponse.json({ message: "A valid user ID is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT application_type, COUNT(*)::int AS count
       FROM (
         SELECT 'loan' AS application_type
         FROM loan_approvals approval
         JOIN loan_applications application
           ON application.id = approval.loan_application_id
         WHERE approval.approver_id = $1
           AND approval.approval_order = application.current_approver_order
           AND approval.status = 'pending'
           AND application.status = 'in_progress'

         UNION ALL

         SELECT 'backup' AS application_type
         FROM backup_approvals approval
         JOIN backup_applications application
           ON application.id = approval.backup_application_id
         WHERE approval.approver_id = $1
           AND approval.approval_order = application.current_approver_order
           AND approval.status = 'pending'
           AND application.status = 'in_progress'

         UNION ALL

         SELECT 'gift' AS application_type
         FROM gift_approvals approval
         JOIN gift_applications application
           ON application.id = approval.gift_application_id
         WHERE approval.approver_id = $1
           AND approval.approval_order = application.current_approver_order
           AND approval.status = 'pending'
           AND application.status = 'in_progress'
       ) pending
       GROUP BY application_type`,
      [approverId],
    );

    const counts = { loan: 0, backup: 0, gift: 0 };
    rows.forEach((row) => {
      counts[row.application_type as keyof typeof counts] = Number(row.count);
    });

    return NextResponse.json({
      ...counts,
      total: counts.loan + counts.backup + counts.gift,
    });
  } catch (error) {
    console.error("Pending approval count error:", error);
    return NextResponse.json({ message: "Unable to fetch pending approvals" }, { status: 500 });
  }
}
