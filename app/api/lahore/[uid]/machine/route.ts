import pool from "@/config/db";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { addLog } from "@/lib/addLog";
import { generateLog } from "@/lib/generateLog";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";

export const createMachineHandler = (office: "lahore" | "karachi") =>
  async function POST(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const inventory = searchParams.get("inventory");
    let client: PoolClient | undefined;

    try {
      const data = await req.json();

      if (!data || Object.keys(data).length === 0) {
        return NextResponse.json(
          { message: "No data provided for insertion" },
          { status: 400 },
        );
      }

      client = await pool.connect();
      await client.query("BEGIN");

      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

      const query = `
        INSERT INTO sale (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

      const result = await client.query(query, values);
      if (data?.customer_id) {
        await client.query(`UPDATE customer SET member = TRUE WHERE id = $1`, [
          data.customer_id,
        ]);
      }

      try {
        const logMSG = generateLog(data, "New Machine added");
        addLog({
          text: logMSG,
          user_id: data.sell_by,
          customer_id: data?.customer_id || null,
          sale_id: result.rows[0].id,
        });
      } catch (error) {
        console.log(error);
      }

      if (inventory) {
        const inventoryId = Number(inventory);
        await client.query(
          `UPDATE order_items 
                SET 
                booked = TRUE, 
                booking_date = $1, 
                machine_id = $2, 
                booked_by = $3, 
                customer_id = $4 
                WHERE id = $5`,
          [
            new Date(),
            result.rows[0].id,
            data.sell_by,
            data.customer_id,
            inventoryId,
          ],
        );
      }

      const partInventoryIds = Array.isArray(data.parts_information)
        ? data.parts_information
            .map((part: { inventory_id?: unknown }) =>
              Number(part.inventory_id),
            )
            .filter((id: number) => Number.isInteger(id) && id > 0)
        : [];

      if (partInventoryIds.length > 0) {
        const inventoryTable =
          office === "karachi" ? "inventory_karachi" : "inventory";
        for (const inventoryId of partInventoryIds) {
          const inventoryResult = await client.query(
            `UPDATE ${inventoryTable}
             SET qty = qty - 1
             WHERE id = $1 AND qty > 0
             RETURNING id`,
            [inventoryId],
          );

          if (inventoryResult.rowCount !== 1) {
            throw new Error(`Inventory item ${inventoryId} is out of stock`);
          }
        }
      }

      const machine = result.rows?.[0] ?? null;

      if (machine) {
        await client.query(
          `INSERT INTO machine_review_history (sale_id, action, actor_id)
         VALUES ($1, 'submitted', $2)`,
          [machine.id, data.sell_by || null],
        );
        const item =
          machine?.type === "Machine"
            ? NOTIFICATION_TYPES.machine_added
            : NOTIFICATION_TYPES.part_added;
        await sendNotificationToOwner(
          `Machine ${machine?.serial_no} needs your approval`,
          `member/${machine?.customer_id}/${machine?.id}?review=1`,
          office,
          item.category,
          "Machine needs approval",
        );
      }
      await client.query("COMMIT");
      return NextResponse.json(
        { message: "Inserted successfully", sale_id: result.rows[0].id },
        { status: 201 },
      );
    } catch (error) {
      await client?.query("ROLLBACK");
      console.error("Error inserting data: ", error);
      return NextResponse.json(
        {
          message:
            error instanceof Error ? error.message : "Error adding customer",
        },
        { status: 500 },
      );
    } finally {
      client?.release();
    }
  };

export const POST = createMachineHandler("lahore");
