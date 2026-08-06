import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { from, vehicle_no, driver_name, manager, received_by, items } =
    await req.json();
  const { uid } = await params;

  try {
    // Insert gatepass
    const gatepassid = await pool.query(
      `INSERT INTO inward_gatepass (from_by, vehicle_no, driver_name, manager, received_by, user_id, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        from,
        vehicle_no,
        driver_name,
        manager,
        received_by,
        uid,
        JSON.stringify(items),
      ],
    );

    // Update inventory
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.inventory_id) {
          await pool.query(
            `UPDATE inventory SET qty = qty + $1 WHERE id = $2`,
            [item.qty, item.inventory_id],
          );
        } else {
          await pool.query(
            `INSERT INTO inventory (name, qty, unit, remarks) VALUES ($1, $2, $3, $4)`,
            [item.name, item.qty, item.unit, item.remarks],
          );
        }
      }
    }

    return NextResponse.json({ id: gatepassid.rows[0].id }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Error saving data" },
      { status: 500 },
    );
  }
}
