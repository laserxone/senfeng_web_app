import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id, cid } = await params;

  try {
     // Fetch customer details
     const customerQuery = await pool.query(`SELECT * FROM customer WHERE id = $1`, [cid]);
    if(customerQuery.rows.length == 0){
        return NextResponse.json([], {status : 200})
    }

     return NextResponse.json(customerQuery.rows[0], { status: 200 });
} catch (error) {
    console.error('Error inserting data: ', error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
}
}

export const revalidate = 0;
