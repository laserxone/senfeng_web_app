import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

async function getIssuedItems(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
  office: "lahore" | "karachi",
) {
  const { uid } = await params;

  try {
    const result = await pool.query(
      `SELECT * from issueditems WHERE user_id = $1 AND office = '${office}' AND received IS FALSE`,
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

export const createIssuedGetHandler =
  (office: "lahore" | "karachi") =>
  (req: NextRequest, context: { params: Promise<{ uid: string }> }) =>
    getIssuedItems(req, context, office);

export const GET = createIssuedGetHandler("lahore");
