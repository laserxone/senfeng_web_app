import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 }
      );
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
        INSERT INTO lab_tasks (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

    await pool.query(query, values);

    console.log("data inserted successfully");
    return NextResponse.json(
      {
        message: "Data saved",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: "Error adding customer" },
      { status: 500 }
    );
  }
}

export async function GET(req:NextRequest, { params }:{params:Promise<{}>}) {

  const searchParams = req.nextUrl.searchParams;
  const user = searchParams.get("user");

  let queryParams = []
  try {
    let query = `
   SELECT
    lt.*,
    u.name AS user_name,
    c.name AS customer_name,
    o.name AS owner_name
FROM lab_tasks lt
LEFT JOIN users u ON u.id = lt.user_id
LEFT JOIN customer c ON c.id = lt.customer_id
LEFT JOIN users o ON o.id = c.ownership
WHERE lt.managing_office = 'lahore'
  `;

  if(user){
    query += " AND u.id = $1"
    queryParams.push(user)
  }
  query += " ORDER BY lt.assign_date DESC"

    const result = await pool.query(query, queryParams);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error:any) {
    console.error("Error ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
