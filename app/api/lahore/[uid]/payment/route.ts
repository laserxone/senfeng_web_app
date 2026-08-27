import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { addLog } from "@/lib/addLog";
import { generateLog } from "@/lib/generateLog";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NextRequest, NextResponse } from "next/server";

export const createPaymentHandler = (office: "lahore" | "karachi") =>
  async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    const reviewResult = await pool.query(
      `SELECT review_status FROM sale WHERE id = $1`,
      [data.machine_id],
    );
    if (reviewResult.rows[0]?.review_status !== "approved") {
      return NextResponse.json(
        { message: "Machine approval is required before adding a payment" },
        { status: 403 },
      );
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
        INSERT INTO payment (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

    const result = await pool.query(query, values);

    // A cheque payment can clear its matching installment for this machine only.
    if (
      String(data.mode || "").toLowerCase() === "cheque" &&
      String(data.cheque_id || "").trim()
    ) {
      await pool.query(
        `UPDATE machine_installments
         SET pending = FALSE
         WHERE id = (
           SELECT id
           FROM machine_installments
           WHERE sale_id = $1
             AND pending = TRUE
             AND TRIM(cheque_number) = $2
           ORDER BY id ASC
           LIMIT 1
         )`,
        [data.machine_id, String(data.cheque_id).trim()],
      );
    }

    const customerResult = await pool.query(
      `
            SELECT c.name AS customer_name, c.id AS customer_id
            FROM payment p
            JOIN sale s ON p.machine_id = s.id
            JOIN customer c ON s.customer_id = c.id
            WHERE p.id = $1`,
      [result.rows[0].id],
    );

    await sendNotificationToOwner(
      `New payment added for ${customerResult.rows[0].customer_name}`,
      `member/${customerResult.rows[0].customer_id}/${result.rows[0].machine_id}?mp=${result.rows[0]?.id}`,
      office,
      NOTIFICATION_TYPES.payment_added.category,
      NOTIFICATION_TYPES.payment_added.title,
    );

    try {
      const logMSG = generateLog(data, "New Payment added");

      addLog({
        text: logMSG,
        user_id: null,
        customer_id: null,
        sale_id: result.rows[0].machine_id,
        payment_id: result.rows[0].id,
      });
    } catch (error) {
      console.log(error);
    }

    return NextResponse.json(
      {
        message: "Payment added successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error?.message || "Error adding payment" },
      { status: 500 },
    );
  }
  };

export const POST = createPaymentHandler("lahore");

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

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

    values.push(id); // Add ID as the last parameter for WHERE clause
    const query = `
            UPDATE payment 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

    await pool.query(query, values);

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
