import pool from "@/config/db";
import deleteImageByPath from "@/lib/delete-image-by-path";
import { reverseOfficeFund } from "@/lib/office-fund-helper";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function POST(req: NextRequest) {
    const client = await pool.connect();

    try {
      const { inv_id, fields } = await req.json();

      if (!inv_id) {
        return NextResponse.json(
          { message: "Invoice id is missing" },
          { status: 400 },
        );
      }

      await client.query("BEGIN");

      const invoice = await client.query(
        `SELECT id FROM savedinvoices WHERE id = $1 AND office = '${office}' FOR UPDATE`,
        [inv_id],
      );
      if (!invoice.rowCount) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Invoice not found for this office" },
          { status: 404 },
        );
      }
      const inventoryIds = [
        ...new Set(
          (Array.isArray(fields) ? fields : [])
            .map((item) => Number(item?.id))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      ];
      if (inventoryIds.length) {
        const stock = await client.query(
          `SELECT id FROM inventory WHERE id = ANY($1::int[]) AND office = '${office}'`,
          [inventoryIds],
        );
        if (stock.rowCount !== inventoryIds.length) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { message: "An inventory item does not belong to this office" },
            { status: 409 },
          );
        }
      }

      const partsQuery = await client.query(
        `SELECT id, image FROM customer_parts WHERE part_id = $1 AND office = '${office}' FOR UPDATE`,
        [inv_id],
      );

      const parts = partsQuery.rows;

      if (fields?.length) {
        for (const item of fields) {
          const id = item?.id;
          const qty = item?.qty || 0;
          if (id) {
            await client.query(
              `UPDATE inventory SET qty = qty + $1 WHERE id = $2 AND office = '${office}'`,
              [qty, id],
            );
          }
        }
      }

      for (const part of parts) {
        await reverseOfficeFund(client, {
          office: office,
          sourceType: "pos_payment",
          sourceId: Number(part.id),
        });
      }

      await client.query(
        `DELETE FROM customer_parts WHERE part_id = $1 AND office = '${office}'`,
        [inv_id],
      );

      await client.query(
        `DELETE FROM savedinvoices WHERE id = $1 AND office = '${office}'`,
        [inv_id],
      );

      await client.query("COMMIT");

      for (const part of parts) {
        if (part.image) {
          await deleteImageByPath(part.image);
        }
      }

      return NextResponse.json(
        { message: "Invoice Deleted successfully" },
        { status: 200 },
      );
    } catch (error: any) {
      await client.query("ROLLBACK");

      console.log(error);

      return NextResponse.json(
        { message: error?.message || "Server error" },
        { status: 500 },
      );
    } finally {
      client.release();
    }
  }
  return { POST };
};

export const { POST } = createPosHandlers("lahore");

export const revalidate = 0;
