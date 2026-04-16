import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const query = `
  SELECT
    si.*,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
  FROM savedinvoices si
  LEFT JOIN customer_parts cp ON cp.part_id = si.id
  GROUP BY si.id
`;
    const result = await pool.query(query);

    const invoices = result.rows.map((invoice) => {
      const itemsTotal = Array.isArray(invoice.fields)
        ? invoice.fields.reduce((sum, item) => {
            const val = Number(item?.total ?? 0);
            return sum + (isNaN(val) ? 0 : val);
          }, 0)
        : 0;
      const discount = Number(invoice.discount ?? 0);
      const finalAmount = itemsTotal - discount;
      const totalPaid = Number(invoice.total_paid ?? 0);
      let status = "NA";
      if (totalPaid === 0) status = "Pending";
      else if (finalAmount - totalPaid !== 0) status = "Partial";
      else status = "Paid";
      return {
        ...invoice,
        items_total: itemsTotal,
        discount,
        final_amount: finalAmount,
        status,
      };
    });

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export const revalidate = 0;
