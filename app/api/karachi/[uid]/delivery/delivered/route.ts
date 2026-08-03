import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{}> }
) {
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
    s.type,
    s.parts_information, 
    c.name AS customer_name, 
    c.owner AS customer_owner,
    c.number AS customer_number,
    u.name AS ownership_name,
    pr.slip AS payment_slip,
    CASE 
      WHEN pr.id IS NULL THEN true 
      ELSE false 
    END AS no_request
  FROM sale s
  JOIN customer c ON s.customer_id = c.id
  LEFT JOIN users u ON c.ownership = u.id
  LEFT JOIN payment_requests pr ON pr.sale_id = s.id
  WHERE s.ready_for_delivery IS TRUE 
    AND s.delivery_date IS NOT NULL
    AND c.office = 'karachi'
  ORDER BY s.delivery_date DESC
`)
    return NextResponse.json(queryResult.rows, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    )
  }
}
