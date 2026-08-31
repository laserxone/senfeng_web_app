import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;

  try {
    const result = await pool.query(
      `SELECT * from issueditems_karachi WHERE user_id = $1 AND received IS FALSE`,
      [uid],
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 200 },
    );
  }
}
