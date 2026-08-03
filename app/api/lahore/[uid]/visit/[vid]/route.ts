import pool from "@/config/db"
import DeleteStorageBackend from "@/lib/delete-storage-backend"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ vid: string }> }
) {
  const { vid } = await params
  if (!vid) {
    return NextResponse.json({ message: "Id is missing" }, { status: 400 })
  }

  try {
    const imagesQuery = await pool.query(
      `SELECT image, signature FROM visit WHERE id = $1`,
      [vid]
    )
    const data = imagesQuery.rows?.[0]
    await DeleteStorageBackend(data?.image)
    await DeleteStorageBackend(data?.signature)
    await pool.query(`DELETE FROM visit WHERE id = $1`, [vid])
    return NextResponse.json({ message: "Feedback delete" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export const revalidate = 0
