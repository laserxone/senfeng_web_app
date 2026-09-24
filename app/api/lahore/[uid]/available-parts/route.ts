import pool from "@/config/db";
import { NextResponse } from "next/server";

export const createAvailablePartsHandler = (
  inventoryTable: "inventory" | "inventory_karachi",
) =>
  async function GET() {
    try {
      const result = await pool.query(
        `SELECT id, name, serial_no, power, model, qty
         FROM ${inventoryTable}
         WHERE qty > 0
         ORDER BY name ASC, id ASC`,
      );
      return NextResponse.json(result.rows);
    } catch (error) {
      console.error("Error getting available parts:", error);
      return NextResponse.json(
        { message: "Unable to get available parts" },
        { status: 500 },
      );
    }
  };

export const GET = createAvailablePartsHandler("inventory");
