import { NextResponse } from "next/server";
import pool from "@/config/db";

export async function GET() {

    try {
        const data = await pool.query(`
  SELECT *
  FROM backup_inventory bi
  WHERE NOT EXISTS (
    SELECT 1
    FROM backup_applications ba
    WHERE ba.backup_inventory_id = bi.id
  )
  ORDER BY bi.name ASC
`);
        return NextResponse.json(data?.rows, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }
}