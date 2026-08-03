import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
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
  FROM savedinvoices_karachi si
  LEFT JOIN customer_parts_karachi cp ON cp.part_id = si.id
  LEFT JOIN customer c
    ON c.id = si.customer_id
LEFT JOIN users u
    ON u.id = c.ownership
  GROUP BY si.id, u.name, c.location
ORDER BY created_at DESC
`
    const result = await pool.query(query)

    const invoices = result.rows.map((invoice) => {
      const itemsTotal = Array.isArray(invoice.fields)
        ? invoice.fields.reduce((sum: number, item: any) => {
            const val = Number(item?.total ?? 0)
            return sum + (isNaN(val) ? 0 : val)
          }, 0)
        : 0
      const discount = Number(invoice.discount ?? 0)
      const finalAmount = itemsTotal - discount
      const totalPaid = Number(invoice.total_paid ?? 0)
      let status = "NA"
      if (itemsTotal === 0) status = "Paid"
      else if (totalPaid === 0) status = "Pending"
      else if (finalAmount - totalPaid !== 0) status = "Partial"
      else status = "Paid"

      return {
        ...invoice,
        items_total: itemsTotal,
        total: finalAmount,
        discount,
        final_amount: finalAmount,
        status,
      }
    })

    return NextResponse.json(invoices, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: "Processing error" }, { status: 500 })
  }
}

export const revalidate = 0
