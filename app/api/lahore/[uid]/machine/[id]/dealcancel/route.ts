import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";

type Office = "lahore" | "karachi";

function getPartInventoryIds(partsInformation: unknown) {
  let parts = partsInformation;

  if (typeof parts === "string") {
    try {
      parts = JSON.parse(parts);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parts)) return [];

  return parts
    .map((part) => Number(part?.inventory_id))
    .filter((inventoryId) => Number.isInteger(inventoryId) && inventoryId > 0);
}

async function restorePartsInventory(
  client: PoolClient,
  office: Office,
  type: unknown,
  partsInformation: unknown,
) {
  if (String(type).toLowerCase() !== "parts") return;

  const inventoryTable =
    office === "karachi" ? "inventory_karachi" : "inventory";
  for (const inventoryId of getPartInventoryIds(partsInformation)) {
    await client.query(
      `UPDATE ${inventoryTable} SET qty = qty + 1 WHERE id = $1`,
      [inventoryId],
    );
  }
}

export const createDealCancelHandler = (office: Office) =>
  async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string; id: string }> },
  ) {
    const { uid, id } = await params;
    const { reason } = await req.json();
    let client: PoolClient | undefined;

    try {
      if (!uid || !id || !reason) {
        return NextResponse.json(
          { message: "Parameters missing" },
          { status: 400 },
        );
      }

      client = await pool.connect();
      await client.query("BEGIN");

      const saleResult = await client.query(
        `SELECT customer_id, type, parts_information FROM sale WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (saleResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Machine not found" },
          { status: 404 },
        );
      }

      const existingCancellation = await client.query(
        `SELECT id FROM cancelled_machine WHERE machine_id = $1 LIMIT 1`,
        [id],
      );
      if (existingCancellation.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Deal is already cancelled" },
          { status: 409 },
        );
      }

      await client.query(
        `INSERT INTO cancelled_machine (machine_id, reason) VALUES ($1, $2)`,
        [id, reason],
      );

      await restorePartsInventory(
        client,
        office,
        saleResult.rows[0].type,
        saleResult.rows[0].parts_information,
      );

      await client.query(
        `UPDATE order_items
       SET booked_by = $1, 
           booking_date = $2, 
           booked = $3, 
           customer_id = $4 
       WHERE machine_id = $5`,
        [null, null, false, null, id],
      );

      const customer_id = saleResult.rows[0]?.customer_id;

      if (!customer_id) {
        throw new Error("Customer not found");
      }

      const saleQuery = await client.query(
        `
  SELECT COUNT(*) 
  FROM sale
  WHERE customer_id = $1
  AND id <> $2
  `,
        [customer_id, id],
      );

      const remainingSales = Number(saleQuery.rows[0].count);

      if (remainingSales === 0) {
        await client.query(`UPDATE customer SET member = $1 WHERE id = $2`, [
          false,
          customer_id,
        ]);
      }

      await client.query("COMMIT");
      return NextResponse.json({ message: "Done" }, { status: 200 });
    } catch (error) {
      await client?.query("ROLLBACK");
      return NextResponse.json(
        {
          message:
            error instanceof Error ? error.message : "Unable to cancel deal",
        },
        { status: 500 },
      );
    } finally {
      client?.release();
    }
  };

export const POST = createDealCancelHandler("lahore");
