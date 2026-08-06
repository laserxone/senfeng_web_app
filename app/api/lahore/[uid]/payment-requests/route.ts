import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const result = await pool.query(`
    SELECT
      pr.id,
      pr.request_type,
      pr.created_at,
      pr.amount,
      pr.slip,
      pr.date,
      pr.tid,
      pr.sale_id,

      s.order_no_arr,
      s.dispatch_information,

      c.id AS customer_id,
      c.name AS customer_name,
      c.owner AS customer_owner,
      c.location AS customer_location,

      u.name AS ownership_name

    FROM payment_requests pr
    LEFT JOIN sale s
      ON s.id = pr.sale_id
    LEFT JOIN customer c
      ON c.id = s.customer_id
    LEFT JOIN users u
      ON u.id = c.ownership
    WHERE pr.office = 'lahore'
    ORDER BY pr.created_at DESC
  `);

  return NextResponse.json(result.rows);
}

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

    values.push(id);
    const query = `
            UPDATE payment_requests 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

    await pool.query(query, values);

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
