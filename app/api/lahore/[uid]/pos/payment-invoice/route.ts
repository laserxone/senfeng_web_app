import pool from "@/config/db";
import { creditOfficeFund, withOfficeFundTransaction } from "@/lib/office-fund-helper";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    const { part_id } = data;
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const added = await withOfficeFundTransaction(pool, async (client) => {
      const invoiceResult = await client.query(
        `SELECT id FROM savedinvoices
         WHERE id = $1 AND invoice_status = 'issued' FOR UPDATE`,
        [part_id],
      );
      if (!invoiceResult.rowCount) return false;

      const query = `
        INSERT INTO customer_parts (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING id, amount, mode, part_id
      `;
      const payment = (await client.query(query, values)).rows[0];
      await creditOfficeFund(client, {
        office: "lahore",
        sourceType: "pos_payment",
        sourceId: Number(payment.id),
        invoiceId: Number(payment.part_id),
        mode: payment.mode,
        amount: payment.amount,
      });
      await client.query(
        `UPDATE savedinvoices SET payment = $1
         WHERE id = $2 AND invoice_status = 'issued'`,
        [true, part_id],
      );
      return true;
    });

    if (!added) {
      return NextResponse.json(
        { message: "Payments can only be added to issued invoices" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Payment added successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error?.message || "Error adding payment" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    if (["amount", "mode", "part_id"].some((field) => updates[field] !== undefined)) {
      const tracked = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM office_fund_movements
           WHERE office = $1 AND source_type = 'pos_payment'
             AND source_id = $2 AND kind = 'pos_payment_added'
         ) AS tracked`,
        ["lahore", id],
      );
      if (tracked.rows[0]?.tracked) {
        return NextResponse.json(
          { message: "A tracked payment's amount, mode or invoice cannot be edited; remove and re-add the payment." },
          { status: 409 },
        );
      }
    }

    const fields: string[] = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `
            UPDATE customer_parts 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

    await pool.query(query, values);

    console.log("data updated successfully");
    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
