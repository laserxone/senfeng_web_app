import pool from "@/config/db";
import DeleteStorageBackend from "@/lib/delete-storage-backend";
import { reverseOfficeFund, withOfficeFundTransaction } from "@/lib/office-fund-helper";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Id is missing" }, { status: 400 });
  }

  try {
    const image = await withOfficeFundTransaction(pool, async (client) => {
      const expense = await client.query(
        `SELECT image FROM branchexpenses WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (!expense.rowCount) return null;
      await client.query(`DELETE FROM branchexpenses WHERE id = $1`, [id]);
      await reverseOfficeFund(client, {
        office: "lahore",
        sourceType: "office_expense",
        sourceId: Number(id),
      });
      return expense.rows[0].image ?? null;
    });
    await DeleteStorageBackend(image);
    return NextResponse.json(
      { message: "Branch expense delete" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
