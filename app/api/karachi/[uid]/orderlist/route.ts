import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const orderItemsQuery = await pool.query(`
  SELECT
  oi.id,
  oi.order_id,
  oi.inventory_id,
  oi.name AS item_name,
  oi.qty,
  oi.price,
  oi.buying_price,
  oi.is_machine,
  oi.machine_serial,
  oi.machine_model,
  oi.machine_source,
  oi.machine_power,
  oi.customer_id,
  oi.booked,
  oi.booking_date,
  oi.status,
  oi.booked_by,
  oi.threshold,
  oi.new_order,
  oi.machine_id,
  oi.location,
  oi.sold_order_no,
  oi.show,

  o.title AS order_title,

  c.name AS customer_name,
  c.location AS customer_location,
  c.owner AS customer_owner,

  owner_user.name AS ownership_name,
  booked_user.name AS booked_name,

  CASE
    WHEN s.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS has_sale,

  CASE
    WHEN s.id IS NOT NULL THEN
      JSON_BUILD_OBJECT(
        'id', s.id,
        'serial_no', s.serial_no,
        'power', s.power,
        'order_no_arr', s.order_no_arr,
        'price', s.price
      )
    ELSE NULL
  END AS sale_data

FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
LEFT JOIN customer c ON c.id = oi.customer_id
LEFT JOIN users owner_user ON owner_user.id = c.ownership
LEFT JOIN users booked_user ON booked_user.id = oi.booked_by
LEFT JOIN sale s ON s.id = oi.machine_id

WHERE oi.show IS TRUE

ORDER BY oi.id DESC
`);

    return NextResponse.json(orderItemsQuery.rows, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
