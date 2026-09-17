import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const office = "karachi";
  const location = req.nextUrl.searchParams.get("location")?.toLowerCase();
  const selectedLocation = ["all", "lahore", "karachi"].includes(location || "")
    ? location!
    : office;

  try {
    const result = await pool.query(
      `SELECT oi.id, oi.order_id, oi.name, oi.machine_model, oi.machine_source,
        oi.machine_power, oi.machine_serial, oi.location,
        o.title AS order_title
       FROM order_items oi
       LEFT JOIN orders o ON o.id = oi.order_id
       WHERE oi.is_machine IS TRUE AND oi.booked IS FALSE AND oi.show IS TRUE
         AND ($1 = 'all' OR LOWER(oi.location) = $1)
       ORDER BY oi.id DESC`,
      [selectedLocation],
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
