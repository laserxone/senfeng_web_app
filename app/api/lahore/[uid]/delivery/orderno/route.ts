import pool from "@/config/db";
import { NextResponse } from "next/server";

async function getOrderNumbers(office: "lahore" | "karachi") {
  try {
    const queryResult = await pool.query(`
  SELECT id, machine_serial, is_machine
  FROM order_items
  WHERE LOWER(location) = '${office}'
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

export const createOrderNumbersGetHandler =
  (office: "lahore" | "karachi") => () =>
    getOrderNumbers(office);

export const GET = createOrderNumbersGetHandler("lahore");
