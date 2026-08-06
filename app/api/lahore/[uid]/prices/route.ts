import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
        INSERT INTO prices (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error saving data" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = `
        SELECT * FROM prices
    `;
    const result = await pool.query(query);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
