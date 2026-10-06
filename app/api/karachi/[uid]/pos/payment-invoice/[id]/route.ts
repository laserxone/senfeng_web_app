import pool from "@/config/db";
import { reverseOfficeFund, withOfficeFundTransaction } from "@/lib/office-fund-helper";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await withOfficeFundTransaction(pool, async (client) => {
      const deleted = await client.query(
        `DELETE FROM customer_parts_karachi WHERE id = $1 RETURNING id`,
        [id],
      );
      if (deleted.rowCount) {
        await reverseOfficeFund(client, {
          office: "karachi",
          sourceType: "pos_payment",
          sourceId: Number(id),
        });
      }
    });

    return NextResponse.json({ message: "Payment Deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
