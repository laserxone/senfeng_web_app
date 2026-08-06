import pool from "@/config/db";
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
    await pool.query(`DELETE FROM news WHERE id = $1`, [id]);
    return NextResponse.json({ message: "Document deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
