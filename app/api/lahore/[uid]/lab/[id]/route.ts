import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { sendNotificationToLabManagers } from "@/lib/sendNotificationToLabManagers";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM lab_tasks WHERE id = $1`, [id]);

    return NextResponse.json({ message: "fine Deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string; id: string }> },
) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { uid, id } = await params;

    if (!uid || !id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    if (
      updates.priority &&
      !["normal", "urgent", "critical"].includes(updates.priority)
    ) {
      return NextResponse.json(
        { message: "Invalid priority" },
        { status: 400 },
      );
    }

    if (updates.parts_receiving_id !== undefined) {
      const task = await pool.query(
        "SELECT customer_id FROM lab_tasks WHERE id = $1 AND managing_office = 'lahore'",
        [id],
      );
      if (!task.rows[0]) {
        return NextResponse.json(
          { message: "Lab task not found" },
          { status: 404 },
        );
      }

      if (updates.parts_receiving_id !== null) {
        const receipt = await pool.query(
          `SELECT customer_id
           FROM parts_receiving
           WHERE id = $1 AND managing_office = 'lahore'`,
          [updates.parts_receiving_id],
        );
        if (!receipt.rows[0]) {
          return NextResponse.json(
            { message: "Parts receipt not found" },
            { status: 404 },
          );
        }

        const customerId = updates.customer_id ?? task.rows[0].customer_id;
        if (Number(receipt.rows[0].customer_id) !== Number(customerId)) {
          return NextResponse.json(
            {
              message:
                "Lab task customer must match the selected parts receipt",
            },
            { status: 400 },
          );
        }
      }
    }

    const fields: string[] = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `
          UPDATE lab_tasks 
          SET ${fields.join(", ")}
          WHERE id = $${values.length} AND managing_office = 'lahore'
          RETURNING *
      `;

    const result = await pool.query(query, values);

    const labTask = result.rows?.[0] ?? null;
    if (labTask) {
      sendNotificationToOwner(
        `${labTask?.remarks_other || labTask?.remarks}`,
        `repairandmaintenance?r=${labTask?.id}`,
        "lahore",
        NOTIFICATION_TYPES.repairing_updated.category,
        NOTIFICATION_TYPES.repairing_updated.title,
      );

      sendNotificationToLabManagers(
        `${labTask?.remarks_other || labTask?.remarks}`,
        `repairandmaintenance?r=${labTask?.id}`,
        "lahore",
        NOTIFICATION_TYPES.repairing_updated.category,
        NOTIFICATION_TYPES.repairing_updated.title,
      );
    }

    console.log("data updated successfully");
    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
