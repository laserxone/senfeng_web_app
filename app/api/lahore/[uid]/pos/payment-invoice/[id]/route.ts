import pool from "@/config/db";
import {
  reverseOfficeFund,
  withOfficeFundTransaction,
} from "@/lib/office-fund-helper";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { message: "ID is required" },
          { status: 400 },
        );
      }
      await withOfficeFundTransaction(pool, async (client) => {
        const deleted = await client.query(
          `DELETE FROM customer_parts WHERE id = $1 AND office = '${office}' RETURNING id`,
          [id],
        );
        if (deleted.rowCount) {
          await reverseOfficeFund(client, {
            office: office,
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
  return { DELETE };
};

export const { DELETE } = createPosHandlers("lahore");

export const revalidate = 0;
