import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
        INSERT INTO machine_installments (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING id
    `;

    const result = await pool.query(query, values);

    return NextResponse.json(
      { message: "Inserted successfully" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error adding customer" },
      { status: 500 },
    );
  }
}
