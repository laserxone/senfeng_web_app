import pool from "@/config/db";
import DeleteStorageBackend from "@/lib/delete-storage-backend";
import {
  reverseOfficeFund,
  withOfficeFundTransaction,
} from "@/lib/office-fund-helper";
import { NextRequest, NextResponse } from "next/server";

async function deleteExpense(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
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
        office,
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

export const createExpenseDeleteHandler =
  (office: "lahore" | "karachi") =>
  (req: NextRequest, context: { params: Promise<{ id: string }> }) =>
    deleteExpense(req, context, office);

export const DELETE = createExpenseDeleteHandler("lahore");

export const revalidate = 0;
