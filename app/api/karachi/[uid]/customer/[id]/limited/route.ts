import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  const { id } = await params;
  try {
    const result = await pool.query(
      `
              SELECT id, order_no_arr, serial_no, power, source
              FROM sale
              WHERE customer_id = $1
              ORDER BY contract_date DESC NULLS LAST, id DESC
            `,
      [id],
    );

    const data = result.rows.map((row) => {
      const orderNumbers = Array.isArray(row.order_no_arr)
        ? row.order_no_arr
        : row.order_no_arr
          ? [row.order_no_arr]
          : [];

      return {
        id: row.id,
        orderNumbers,
        serial: row.serial_no || "",
        power: row.power || "",
        source: row.source || "",
      };
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
