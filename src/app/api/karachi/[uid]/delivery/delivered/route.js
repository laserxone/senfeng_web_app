import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const queryResult = await pool.query(`
  SELECT 
     s.id,
    s.order_no_arr,
    s.delivery_date,
    s.power,
    s.source,
     s.serial_no,
    s.delivery_information,
    s.dispatch_information, 
    c.name AS customer_name, 
    c.owner AS customer_owner,
    u.name AS ownership_name
  FROM sale s
  JOIN customer c ON s.customer_id = c.id
  JOIN users u ON c.ownership = u.id
  WHERE s.ready_for_delivery IS TRUE AND delivery_date IS NOT NULL
  AND c.office = 'karachi'
  ORDER BY s.delivery_date DESC
`);

    return NextResponse.json(queryResult.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}