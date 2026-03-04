import pool from "@/config/db"
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

    const { uid } = await params

    try {

        const queryResult = await pool.query(`
  SELECT 
    s.*, 
    c.name AS customer_name, 
    c.owner AS customer_owner,
    u.name AS ownership_name
  FROM sale s
  JOIN customer c ON s.customer_id = c.id
  JOIN users u ON c.ownership = u.id
  WHERE s.ready_for_delivery IS TRUE 
    AND s.delivery_date IS NULL AND c.office = 'karachi'
`);

        return NextResponse.json(queryResult.rows, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }

}
