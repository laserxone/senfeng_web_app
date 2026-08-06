import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const branch = "karachi";
  const searchParams = req.nextUrl.searchParams;

  try {
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const salaryQuery = `
            SELECT 
                u.id AS user_id,
                u.name,
                COALESCE(s.payable, 0) AS payable,
                s.month,
                s.year,
                s.issued
            FROM users u
            LEFT JOIN salaries s 
                ON u.id = s.user_id 
                AND s.month = $1 
                AND s.year = $2 
                AND s.issued = $3
            WHERE u.active IS TRUE AND u.office = '${branch}'
            ORDER BY u.name ASC;
        `;

    const salaryResult = await pool.query(salaryQuery, [month, year, true]);

    return NextResponse.json(salaryResult.rows, { status: 200 });
  } catch (error: any) {
    console.log("Error fetching data: ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
