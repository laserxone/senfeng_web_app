import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> },
  ) {
    const { from, vehicle_no, driver_name, manager, received_by, items } =
      await req.json();
    const { uid } = await params;

    try {
      if (!Array.isArray(items) || items.some((item) => !item.inventory_id)) {
        return NextResponse.json(
          { message: "Every inward item must be selected from inventory" },
          { status: 400 },
        );
      }

      const inventoryIds = [
        ...new Set(items.map((item) => Number(item.inventory_id))),
      ];
      const available = await pool.query(
        `SELECT id FROM inventory WHERE id = ANY($1::int[]) AND office = '${office}'`,
        [inventoryIds],
      );
      if (available.rowCount !== inventoryIds.length) {
        return NextResponse.json(
          { message: "An inventory item does not belong to this office" },
          { status: 409 },
        );
      }

      // Insert gatepass
      const gatepassid = await pool.query(
        `INSERT INTO inward_gatepass (from_by, vehicle_no, driver_name, manager, received_by, user_id, items, office)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '${office}') RETURNING id`,
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
          await pool.query(
            `UPDATE inventory SET qty = qty + $1 WHERE id = $2 AND office = '${office}'`,
            [item.qty, item.inventory_id],
          );
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
  return { POST };
};

export const { POST } = createPosHandlers("lahore");
