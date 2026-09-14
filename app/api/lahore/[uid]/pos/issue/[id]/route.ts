import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      `UPDATE savedinvoices
       SET invoice_status = 'issued'
       WHERE id = $1 AND invoice_status = 'proforma'
       RETURNING id, invoicenumber, invoice_status`,
      [id],
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { message: "Only a pro forma invoice can be issued" },
        { status: 409 },
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("Error issuing pro forma invoice:", error);
    return NextResponse.json(
      { message: error?.message || "Unable to issue invoice" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
