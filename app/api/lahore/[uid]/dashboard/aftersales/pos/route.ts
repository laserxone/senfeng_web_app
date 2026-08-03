import pool from "@/config/db"
import moment from "moment"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
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
        discount,
        total: finalAmount,
        final_amount: finalAmount - totalPaid,
        status,
      }
    })

    const total_pending = invoices
      .filter(
        (item) =>
          moment(item.created_at).isSameOrAfter("2025-12-01") ||
          item.payment === false
      )
      .filter((item) => item.status !== "Paid")
      .reduce((sum, item) => sum + (item.final_amount || 0), 0)

    const total_sales = invoices.reduce(
      (sum, item) => sum + (item.final_amount || 0),
      0
    )

    const total_completed = total_sales - total_pending

    const collection = (total_completed * 100) / total_sales

    const responseData = {
      total_completed,
      total_pending,
      total_sales,
      collection,
      data: invoices,
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json({ message: error?.message }, { status: 500 })
  }
}
