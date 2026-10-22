import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { id } = await params;
    const { olditems, newitems } = await req.json();

    try {
      const invoice = await pool.query(
        `SELECT id FROM savedinvoices WHERE id = $1 AND office = '${office}'`,
        [id],
      );
      if (!invoice.rowCount) {
        return NextResponse.json(
          { message: "Invoice not found for this office" },
          { status: 404 },
        );
      }
      const inventoryIds = [
        ...new Set(
          [...olditems.fields, ...newitems.fields]
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
      for (const item of olditems.fields) {
        const { id: itemId, qty } = item;
        await pool.query(
          `UPDATE inventory SET qty = qty + $1 WHERE id = $2 AND office = '${office}'`,
          [qty, itemId],
        );
      }

      for (const item of newitems.fields) {
        const { id: itemId, qty } = item;
        await pool.query(
          `UPDATE inventory SET qty = qty - $1 WHERE id = $2 AND office = '${office}'`,
          [qty, itemId],
        );
      }

      await pool.query(
        `UPDATE savedinvoices SET
                  name = $1,
                  company = $2,
                  phone = $3,
                  address = $4,
                  manager = $5,
                  invoicenumber = $6,
                  fields = $7,
                  payment = $8,
                  discount = $9
               WHERE id = $10 AND office = '${office}'`,
        [
          newitems.name,
          newitems.company,
          newitems.phone,
          newitems.address,
          newitems.manager,
          newitems.invoicenumber,
          JSON.stringify(newitems.fields),
          newitems.payment,
          newitems.discount,
          id,
        ],
      );

      return NextResponse.json(
        { message: "Invoice updated successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Processing error" },
        { status: 500 },
      );
    }
  }
  return { PUT };
};

export const { PUT } = createPosHandlers("lahore");

export const revalidate = 0;
