import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const query = `
    SELECT * FROM settings;
    `;

    const result = await pool.query(query);
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields: string[] = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 },
      );
    }

    values.push(id); // Add ID as the last parameter for WHERE clause
    const query = `
            UPDATE settings 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

    await pool.query(query, values);

    console.log("data updated successfully");
    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
