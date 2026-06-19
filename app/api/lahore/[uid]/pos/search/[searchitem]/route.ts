import pool from "@/config/db";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ searchitem: string }> }) {
  const { searchitem } = await params;
  const searchParams = req.nextUrl.searchParams;
  const pending = searchParams.get("pending");

  try {
   
    if (searchitem !== "null") {
     const query = `
  SELECT
    si.*,
    COALESCE(
      NULLIF(TRIM(si.manager), ''),
      u.name,
      ''
    ) AS manager,
    COALESCE(
      NULLIF(TRIM(c.location), ''),
      si.address,
      ''
    ) AS customer_location,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
  FROM savedinvoices si
  LEFT JOIN customer_parts cp 
    ON cp.part_id = si.id
  LEFT JOIN customer c
    ON c.id = si.customer_id
  LEFT JOIN users u
    ON u.id = c.ownership
  WHERE
    si.name ILIKE $1 OR
    si.company ILIKE $1 OR
    si.phone ILIKE $1 OR
    si.invoicenumber ILIKE $1 OR
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(si.fields, '[]'::jsonb)) AS elem
      WHERE elem->>'name' ILIKE $1
        OR elem->>'description' ILIKE $1
    )
  GROUP BY si.id, u.name, c.location
  ORDER BY si.created_at DESC
`;

      const values = [`%${searchitem}%`];
      const result = await pool.query(query, values);
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
          total : finalAmount,
          final_amount: finalAmount,
          status,
        };
      });

      return NextResponse.json(invoices, { status: 200 });
    } else if (pending) {
      const query = `
  SELECT
    si.*,
    COALESCE(
        NULLIF(TRIM(si.manager), ''),
        u.name,
        ''
    ) AS manager,
    COALESCE(
        NULLIF(TRIM(c.location), ''),
        si.address,
        ''
    ) AS customer_location,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
FROM savedinvoices si
LEFT JOIN customer_parts cp
    ON cp.part_id = si.id
LEFT JOIN customer c
    ON c.id = si.customer_id
LEFT JOIN users u
    ON u.id = c.ownership
WHERE si.owner_paid IS FALSE
GROUP BY si.id, u.name, c.location
ORDER BY created_at DESC
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
           total : finalAmount,
          final_amount: finalAmount - totalPaid,
          status,
        };
      });

      return NextResponse.json(
        invoices.filter(
          (item) =>
            moment(item.created_at).isSameOrAfter("2025-12-01") ||
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
