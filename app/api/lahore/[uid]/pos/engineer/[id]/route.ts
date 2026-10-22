import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { id } = await params;
    const { field } = await req.json();

    try {
      const inventoryIds = [
        ...new Set(
          (Array.isArray(field) ? field : [])
            .map((item) => Number(item?.id))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      ];
      if (inventoryIds.length) {
        const stock = await pool.query(
          `SELECT id FROM inventory WHERE id = ANY($1::int[]) AND office = '${office}'`,
          [inventoryIds],
        );
        if (stock.rowCount !== inventoryIds.length) {
          return NextResponse.json(
            { message: "An inventory item does not belong to this office" },
            { status: 409 },
          );
        }
      }
      const query = await pool.query(
        `
    UPDATE issueditems SET received = $1, receiving_date = $2 WHERE id = $3 AND office = '${office}'
  `,
        [true, new Date(), id],
      );
      if (query.rowCount !== 1) {
        return NextResponse.json(
          { message: "Issued item not found for this office" },
          { status: 404 },
        );
      }

      for (const item of field) {
        const { id: itemId, qty } = item;
        await pool.query(
          `UPDATE inventory SET qty = qty + $1 WHERE id = $2 AND office = '${office}'`,
          [qty, itemId],
        );
      }

      return NextResponse.json(query.rows, { status: 200 });
    } catch (error: any) {
      return NextResponse.json(
        { message: error?.message || "Error" },
        { status: 500 },
      );
    }
  }
  return { POST };
};

export const { POST } = createPosHandlers("lahore");

export const revalidate = 0;
