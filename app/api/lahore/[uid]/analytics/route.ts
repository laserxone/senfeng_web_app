import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start");
  const end_date = searchParams.get("end");
  const user = searchParams.get("user");

  const { uid } = await params;

  if (!uid) {
    return NextResponse.json({ message: "ID is missing" }, { status: 400 });
  }

  try {
    const isSuper = await checkSuperadmin(uid);

    if (!isSuper) {
      return NextResponse.json(
        { message: "You are not allowed to perform this action" },
        { status: 400 },
      );
    }

    const queryParams = [];

    let query = `
   SELECT 
    s.*,
    c.*,
    u.name AS user_name,
    c.id AS customer_id,
    s.id AS sale_id
FROM sale s
JOIN customer c ON s.customer_id = c.id
LEFT JOIN users u ON s.sell_by = u.id
WHERE s.contract_date BETWEEN $1 AND $2

    `;

    queryParams.push(start_date);
    queryParams.push(end_date);

    if (user) {
      query += ` AND sell_by = $3`;
      queryParams.push(user);
    }

    const result = await pool.query(query, queryParams);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.log("Error inserting data: ", error);
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
