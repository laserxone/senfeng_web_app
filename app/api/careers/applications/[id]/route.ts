import pool from "@/config/db"
import admin from "@/lib/firebaseAdmin"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { message: "Resume ID is required." },
        { status: 400 }
      )
    }

    const res = await pool.query(`SELECT cv_url FROM resumes WHERE id = $1`, [
      id,
    ])
    const data = res.rows?.[0] ?? null

    if (!data) {
      return NextResponse.json({ message: "Data not found" }, { status: 400 })
    }

    const bucket = admin.storage().bucket()

    if (data?.cv_url) {
      try {
        await bucket.file(data?.cv_url).delete()
      } catch (error) {
        console.error("Storage delete error:", error)
      }
    }

    await pool.query(`DELETE FROM resumes WHERE id = $1`, [id])

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully.",
    })
  } catch (error) {
    console.error("Delete resume error:", error)

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    )
  }
}
