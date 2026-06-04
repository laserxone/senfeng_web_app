import { NextRequest, NextResponse } from "next/server";
import pool from "@/config/db";

export async function POST(req : NextRequest) {
  const data = await req.json()


  try {

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
    INSERT INTO complaint_payments (${fields.join(", ")})
    VALUES (${placeholders})
    RETURNING *
`;

    await pool.query(query, values);
    return NextResponse.json({message : "Done"}, { status: 200 });
  } catch (error : any) {
    return NextResponse.json({ message: error.message || "Error occured" }, { status: 500 });
  }

}