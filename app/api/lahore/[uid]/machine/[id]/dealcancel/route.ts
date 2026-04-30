import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest, { params }:{params:Promise<{uid:string,id:string}>}) {
  const { uid, id } = await params;

  const { reason } = await req.json();

  try {
    if (!uid || !id || !reason) {
      return NextResponse.json(
        { message: "Parameters missing" },
        { status: 400 },
      );
    }

    await pool.query(
      `INSERT INTO cancelled_machine (machine_id, reason) VALUES ($1, $2)`,
      [id, reason],
    );

    await pool.query(
      `UPDATE order_items 
       SET booked_by = $1, 
           booking_date = $2, 
           booked = $3, 
           customer_id = $4 
       WHERE machine_id = $5`,
      [null, null, false, null, id],
    );

    const saleRow = await pool.query(
      `SELECT customer_id FROM sale WHERE id = $1`,
      [id],
    );
    const customer_id = saleRow.rows[0]?.customer_id;

    if (!customer_id) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 400 },
      );
    }

    const saleQuery = await pool.query(
      `
  SELECT COUNT(*) 
  FROM sale
  WHERE customer_id = $1
  AND id <> $2
  `,
      [customer_id, id],
    );

    const remainingSales = Number(saleQuery.rows[0].count);

    if (remainingSales === 0) {
      await pool.query(`UPDATE customer SET member = $1 WHERE id = $2`, [
        false,
        customer_id,
      ]);
    }

    return NextResponse.json({ message: "Done" }, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ message: error?.message }, { status: 500 });
  }
}
