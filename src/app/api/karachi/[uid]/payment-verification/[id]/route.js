import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { NextResponse } from "next/server";


export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE payment 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    sendNotificationToOwnership(id, data?.status, data?.comment)

    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0

async function sendNotificationToOwnership(paymentId, status = "", comment = "") {

  const result = await pool.query(`
  SELECT 
    u.id AS user_id,
    u.name AS user_name,
    c.id AS customer_id,
    c.name AS customer_name,
    c.ownership,
    s.id AS sale_id
  FROM payment p
  INNER JOIN sale s ON p.machine_id = s.id
  INNER JOIN customer c ON s.customer_id = c.id
  INNER JOIN users u ON c.ownership = u.id
  WHERE p.id = $1
`, [paymentId]);

  if (result.rows.length > 0) {
    const user = result.rows[0];
    const title = status === 'approved' ? "Payment verified" : "Payment rejected";
    sendNotification(title, `member/${user.customer_id}/${user.sale_id}`, user.user_id);
    sendNotificationToMobile(title, "Payment", user.user_id, user, "client", `/dashboard/customer/${user.customer_id}/machine/${user.sale_id}`)
  }
}