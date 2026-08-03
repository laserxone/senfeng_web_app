import pool from "@/config/db"
import DeleteStorageBackend from "@/lib/delete-storage-backend"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ message: "Id is missing" }, { status: 400 })
  }

  try {
    const imageQuery = await pool.query(
      `SELECT image FROM branchexpenses WHERE id = $1`,
      [id]
    )
    const image = imageQuery.rows?.[0]?.image ?? null
    await DeleteStorageBackend(image)
    await pool.query(`DELETE FROM branchexpenses WHERE id = $1`, [id])
    return NextResponse.json(
      { message: "Branch expense delete" },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
