import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { searchitem } = await params;
  const searchParams = req.nextUrl.searchParams;
  const pending = searchParams.get("pending");
  const all = searchParams.get("all");

  try {
    if (all) {
      const query = `
      SELECT * FROM savedinvoices`;
      const result = await pool.query(query);
      return NextResponse.json(result.rows, { status: 200 });
    }

    if (searchitem !== "null") {
      console.log(2);
      const query = `
        SELECT * FROM savedinvoices 
  WHERE 
    name ILIKE $1 OR 
    company ILIKE $1 OR 
    phone ILIKE $1 OR 
    invoicenumber ILIKE $1 OR 
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(fields) AS elem
      WHERE elem->>'name' ILIKE $1
    )
      `;

      const values = [`%${searchitem}%`];
      const result = await pool.query(query, values);
      return NextResponse.json(result.rows, { status: 200 });
    } else if (pending) {
      const query = `
  SELECT 
    si.*, 
    u.name AS owner_name
  FROM savedinvoices si
  LEFT JOIN customer c ON c.id = si.customer_id
  LEFT JOIN users u ON u.id = c.ownership
  WHERE si.payment = FALSE
`;
      const result = await pool.query(query);
      return NextResponse.json(result.rows, { status: 200 });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export const revalidate = 0;
