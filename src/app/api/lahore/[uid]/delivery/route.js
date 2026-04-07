import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const queryResult = await pool.query(`
  SELECT 
    s.*, 
    c.name AS customer_name, 
    c.owner AS customer_owner,
    u.name AS ownership_name
  FROM sale s
  JOIN customer c ON s.customer_id = c.id
  JOIN users u ON c.ownership = u.id
  WHERE s.ready_for_delivery IS TRUE 
    AND c.office = 'lahore'
`);

    return NextResponse.json(queryResult.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const data = await req.json();

  try {
    const existingNamePlate = await pool.query(
      `SELECT machine_nameplate_images FROM sale WHERE id = $1`,
      [data.machine_id],
    );
    const existing =
      existingNamePlate.rows?.[0]?.machine_nameplate_images || [];
    const combinedNamePlates = [...existing, ...data.machine_nameplate_images];

    await pool.query(
      `UPDATE sale SET machine_nameplate_images = $1, order_no_arr  =$2, delivery_date = $3, dispatch_information = $4 WHERE id = $5`,
      [
        combinedNamePlates,
        data.order_no_arr,
        data.delivery_date,
        data.dispatch_information,
        data.machine_id,
      ],
    );

    await pool.query(`
        UPDATE order_items SET status = $1, WHERE machine_id = $2`, ["Dispatched", data.machine_id])

    return NextResponse.json({ message: "Done" }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
