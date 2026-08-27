import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NextRequest, NextResponse } from "next/server";

export const createMachineReviewHandler = (office: "lahore" | "karachi") => async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  const { id, uid } = await params;
  const { action, comment } = await req.json();
  const client = await pool.connect();
  let transactionFinished = false;

  try {
    await client.query("BEGIN");
    const machineResult = await client.query(
      `SELECT id, customer_id, sell_by, serial_no, review_status FROM sale WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const machine = machineResult.rows[0];
    if (!machine) return NextResponse.json({ message: "Machine not found" }, { status: 404 });

    const userResult = await client.query(
      `SELECT id, designation, office FROM users WHERE id = $1`,
      [uid],
    );
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (action === "resubmit") {
      if (Number(machine.sell_by) !== Number(uid)) {
        return NextResponse.json({ message: "Only the employee who added this machine can resubmit it" }, { status: 403 });
      }
      if (machine.review_status !== "rejected") {
        return NextResponse.json(
          { message: "Only a rejected machine can be sent for review again" },
          { status: 409 },
        );
      }
      await client.query(
        `UPDATE sale SET review_status = 'pending', reviewed_by = NULL, reviewed_at = NULL WHERE id = $1`,
        [id],
      );
      await client.query(
        `INSERT INTO machine_review_history (sale_id, action, comment, actor_id)
         VALUES ($1, 'resubmitted', $2, $3)`,
        [id, comment?.trim() || null, uid],
      );
      await client.query("COMMIT");
      transactionFinished = true;
      await sendNotificationToOwner(`Machine ${machine.serial_no} needs your approval`, `member/${machine.customer_id}/${machine.id}?review=1`, office, NOTIFICATION_TYPES.machine_added.category, "Machine needs approval");
      return NextResponse.json({ message: "Machine sent for review" });
    }

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ message: "Invalid review action" }, { status: 400 });
    }
    if (action === "rejected" && !comment?.trim()) {
      return NextResponse.json({ message: "A comment is required when rejecting a machine" }, { status: 400 });
    }
    if (user.designation !== "Owner" || user.office?.toLowerCase() !== office) {
      return NextResponse.json({ message: "Only an owner of this office can review this machine" }, { status: 403 });
    }
    if (machine.review_status !== "pending") {
      return NextResponse.json({ message: "This machine is not awaiting review" }, { status: 409 });
    }

    await client.query(
      `UPDATE sale SET review_status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [action, uid, id],
    );
    await client.query(
      `INSERT INTO machine_review_history (sale_id, action, comment, actor_id)
       VALUES ($1, $2, $3, $4)`,
      [id, action, comment?.trim() || null, uid],
    );
    await client.query("COMMIT");
    transactionFinished = true;

    await sendNotification(
      `Machine ${action}${comment?.trim() ? `: ${comment.trim()}` : ""}`,
      `member/${machine.customer_id}/${machine.id}`,
      machine.sell_by,
      `Machine ${action}`,
      NOTIFICATION_TYPES.machine_added.category,
    );
    return NextResponse.json({ message: `Machine ${action}` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Machine review error:", error);
    return NextResponse.json({ message: "Unable to update machine review" }, { status: 500 });
  } finally {
    if (!transactionFinished) await client.query("ROLLBACK");
    client.release();
  }
};

export const POST = createMachineReviewHandler("lahore");
