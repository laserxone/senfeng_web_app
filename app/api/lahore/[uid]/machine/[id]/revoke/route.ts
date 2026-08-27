import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const prQuery = await client.query(
        `SELECT id FROM payment_requests WHERE sale_id = $1`,
        [id],
      );
      if (prQuery.rows.length > 0) {
        return NextResponse.json({
          message:
            "An active payment request already exists. Please remove the existing request before revoking.",
        });
      }
      await client.query(
        `
      UPDATE order_items
      SET status = $1
      WHERE machine_id = $2
      `,
        ["Order Placed", id],
      );

      await client.query(
        `
      UPDATE sale
      SET ready_for_delivery = $1,
          delivery_information = $2,
          delivery_request_date = $3
      WHERE id = $4
      `,
        [false, JSON.stringify({}), null, id],
      );

      await client.query("COMMIT");

      console.log("data updated successfully");

      return NextResponse.json(
        { message: "Updated successfully" },
        { status: 200 },
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
