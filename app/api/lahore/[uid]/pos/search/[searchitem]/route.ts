import pool from "@/config/db";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ searchitem: string }> }) {
  const { searchitem } = await params;
  const searchParams = req.nextUrl.searchParams;
  const pending = searchParams.get("pending");
  const all = searchParams.get("all");

  try {
    if (all) {
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
          ? invoice.fields.reduce((sum: number, item: any) => {
            const val = Number(item?.total ?? 0);
            return sum + (isNaN(val) ? 0 : val);
          }, 0)
          : 0;
        const discount = Number(invoice.discount ?? 0);
        const finalAmount = itemsTotal - discount;
        const totalPaid = Number(invoice.total_paid ?? 0);
        let status = "NA";
        if (itemsTotal === 0) status = "Paid"
        else if (totalPaid === 0) status = "Pending";
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
    }

    if (searchitem !== "null") {
      const query = `
       SELECT
  si.*,
  COALESCE(p.total_paid, 0) AS total_paid
FROM savedinvoices si
LEFT JOIN (
  SELECT
    part_id,
    SUM(amount::numeric) AS total_paid
  FROM customer_parts
  GROUP BY part_id
) p ON p.part_id = si.id
WHERE
  si.name ILIKE $1 OR
  si.company ILIKE $1 OR
  si.phone ILIKE $1 OR
  si.invoicenumber ILIKE $1 OR
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements(si.fields) AS elem
    WHERE elem->>'name' ILIKE $1
  );
      `;

      const values = [`%${searchitem}%`];
      const result = await pool.query(query, values);
      const invoices = result.rows.map((invoice) => {
        // Sum totals from fields array
        const itemsTotal = Array.isArray(invoice.fields)
          ? invoice.fields.reduce((sum: number, item: any) => {
            const val = Number(item?.total ?? 0);
            return sum + (isNaN(val) ? 0 : val);
          }, 0)
          : 0;

        const discount = Number(invoice.discount ?? 0);
        const finalAmount = itemsTotal - discount;
        const totalPaid = Number(invoice.total_paid ?? 0);
        let status = "NA";
        if (itemsTotal === 0) status = "Paid"
        else if (totalPaid === 0) status = "Pending";
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
    } else if (pending) {
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
          ? invoice.fields.reduce((sum: number, item: any) => {
            const val = Number(item?.total ?? 0);
            return sum + (isNaN(val) ? 0 : val);
          }, 0)
          : 0;
        const discount = Number(invoice.discount ?? 0);
        const finalAmount = itemsTotal - discount;
        const totalPaid = Number(invoice.total_paid ?? 0);
        let status = "NA";
        if (itemsTotal === 0) status = "Paid"
        else if (totalPaid === 0) status = "Pending";
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

      const filteredInvoices = invoices.map((item)=>{
        if(moment(item.created_at).isSameOrAfter("2026-01-01")) return item
        else if(item.payment === false) return item
        else return null
      }).filter(Boolean)

      return NextResponse.json(
        invoices.filter(
          (item) =>
            moment(item.created_at).isSameOrAfter("2026-01-01") ||
    item.payment === false
        ).filter((item) => item.status !== "Paid"),
        { status: 200 },
      );
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export const revalidate = 0;
