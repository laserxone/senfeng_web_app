import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";

type InventoryItem = {
  name?: unknown;
  serial_no?: unknown;
  model?: unknown;
  power?: unknown;
  unit?: unknown;
  chinese_name?: unknown;
  price?: unknown;
  buying?: unknown;
  remarks?: unknown;
};

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
const number = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? Number(value)
    : Number.NaN;

export const createInventoryItemsHandler = (
  inventoryTable: "inventory" | "inventory_karachi",
) =>
  async function POST(req: NextRequest) {
    let client: PoolClient | undefined;

    try {
      const { items } = (await req.json()) as { items?: InventoryItem[] };
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { message: "At least one inventory item is required" },
          { status: 400 },
        );
      }

      const normalizedItems = items.map((item) => ({
        name: text(item.name),
        serial_no: text(item.serial_no),
        model: text(item.model),
        power: text(item.power),
        unit: text(item.unit),
        chinese_name: text(item.chinese_name),
        price: number(item.price),
        buying: number(item.buying),
        remarks: text(item.remarks),
      }));

      if (
        normalizedItems.some(
          (item) =>
            !item.name ||
            !item.serial_no ||
            !Number.isFinite(item.price) ||
            !Number.isFinite(item.buying) ||
            item.price < 0 ||
            item.buying < 0,
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Name, serial number, price, and buying price are required for every item",
          },
          { status: 400 },
        );
      }

      client = await pool.connect();
      await client.query("BEGIN");
      for (const item of normalizedItems) {
        await client.query(
          `INSERT INTO ${inventoryTable} (name, serial_no, model, power, unit, chinese_name, price, buying, remarks, qty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)`,
          [
            item.name,
            item.serial_no,
            item.model || null,
            item.power || null,
            item.unit || null,
            item.chinese_name || null,
            item.price,
            item.buying,
            item.remarks || null,
          ],
        );
      }
      await client.query("COMMIT");

      return NextResponse.json({ message: "Inventory items added" });
    } catch (error) {
      await client?.query("ROLLBACK");
      console.error("Error adding inventory items:", error);
      return NextResponse.json(
        { message: "Unable to add inventory items" },
        { status: 500 },
      );
    } finally {
      client?.release();
    }
  };

export const POST = createInventoryItemsHandler("inventory");
