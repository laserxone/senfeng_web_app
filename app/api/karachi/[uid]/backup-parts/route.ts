import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
        INSERT INTO backup_inventory (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error saving data" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const inventoryResult = await pool.query(`
      SELECT *
      FROM backup_inventory
      ORDER BY created_at DESC
    `);

    const applicationResult = await pool.query(`
      SELECT
        ba.*,
        c.name AS customer_name,
        u.name AS user_name
      FROM backup_applications ba
      LEFT JOIN sale s
        ON ba.sale_id = s.id
      LEFT JOIN customer c
        ON s.customer_id = c.id
      LEFT JOIN users u
        ON ba.user_id = u.id
    `);

    const applicationMap = new Map(
      applicationResult.rows.map((item) => [item.backup_inventory_id, item]),
    );

    const data = inventoryResult.rows.map((inventory) => ({
      ...inventory,
      backup_application_detail: applicationMap.get(inventory.id) ?? null,
      status: applicationMap.get(inventory.id)
        ? "given_to_customer"
        : "in_stock",
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || "Something went wrong",
      },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
