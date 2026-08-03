import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { olditems, newitems } = await req.json()

  try {
    for (const item of olditems.fields) {
      const { id: itemId, qty } = item
      await pool.query(
        `UPDATE inventory_karachi SET qty = qty + $1 WHERE id = $2`,
        [qty, itemId]
      )
    }

    for (const item of newitems.fields) {
      const { id: itemId, qty } = item
      await pool.query(
        `UPDATE inventory_karachi SET qty = qty - $1 WHERE id = $2`,
        [qty, itemId]
      )
    }

    await pool.query(
      `UPDATE savedinvoices_karachi SET 
                name = $1,
                company = $2,
                phone = $3,
                address = $4,
                manager = $5,
                invoicenumber = $6,
                fields = $7,
                payment = $8,
                discount= $9
             WHERE id = $10`,
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
      ]
    )

    return NextResponse.json(
      { message: "Invoice updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: "Processing error" }, { status: 500 })
  }
}

export const revalidate = 0
