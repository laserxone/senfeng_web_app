

import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const queryResult = await pool.query(`
  SELECT id, machine_serial
  FROM order_items
  WHERE LOWER(location) = 'lahore'
  ORDER BY machine_serial ASC
`);

    return NextResponse.json(queryResult.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}