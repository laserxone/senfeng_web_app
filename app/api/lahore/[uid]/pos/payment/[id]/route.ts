import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { payment } = await req.json();

  try {
    await pool.query(
      `UPDATE savedinvoices SET 
                payment = $1
             WHERE id = $2`,
      [payment, id],
    );

    return NextResponse.json(
      { message: "Invoice updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const query = await pool.query(
      `SELECT * FROM savedinvoices WHERE id = $1`,
      [id],
    );
    const paymentQuery = await pool.query(
      `SELECT * FROM customer_parts WHERE part_id = $1`,
      [id],
    );

    return NextResponse.json(
      { ...(query.rows[0] ?? null), payments: paymentQuery.rows },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM customer_parts WHERE id = $1`, [id]);

    return NextResponse.json({ message: "Payment Deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
