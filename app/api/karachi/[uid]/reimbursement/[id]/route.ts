import pool from "@/config/db";
import DeleteStorageBackend from "@/lib/delete-storage-backend";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    const imageQuery = await pool.query(`SELECT image FROM reimbursement WHERE id = $1`, [id])
    const image = imageQuery.rows[0]?.image ?? null
    await DeleteStorageBackend(image)

    await pool.query(`DELETE FROM reimbursement WHERE id = $1`, [id]);


    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0