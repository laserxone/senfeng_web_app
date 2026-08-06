import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { addLog } from "@/lib/addLog";
import { generateLog } from "@/lib/generateLog";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id, uid } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
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
          UPDATE sale 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING *
      `;

    const result = await pool.query(query, values);

    await pool.query(
      `UPDATE order_items
        SET status = 'Delivery Requested'
        WHERE machine_id = $1`,
      [id],
    );

    const machine = result.rows?.[0] ?? null;
    if (
      machine &&
      data?.ready_for_delivery &&
      data?.ready_for_delivery === true
    ) {
      sendNotificationToOwner(
        `${machine?.serial_no}`,
        `member/${machine?.customer_id}/${machine.id}`,
        "lahore",
        NOTIFICATION_TYPES.machine_delivery_applied.category,
        NOTIFICATION_TYPES.machine_delivery_applied.title,
      );
    }

    try {
      const logMSG = generateLog(data, "Machine updated");
      addLog({
        text: logMSG,
        user_id: uid,
        customer_id: result.rows[0].customer_id,
        sale_id: result.rows[0].id,
      });
    } catch (error) {
      console.log(error);
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
