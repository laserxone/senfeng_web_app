import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

async function getSettings(office: "lahore" | "karachi") {
  try {
    const result = await pool.query(
      "SELECT * FROM settings WHERE office = $1 LIMIT 1",
      [office],
    );
    return NextResponse.json(result.rows[0] ?? null, { status: 200 });
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

async function putSettings(req: NextRequest, office: "lahore" | "karachi") {
  try {
    const data = await req.json();
    const { id, ...updates } = data;
    delete updates.office;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields: string[] = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${values.length + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 },
      );
    }

    values.push(id, office);
    const query = `
            UPDATE settings 
            SET ${fields.join(", ")}
            WHERE id = $${values.length - 1} AND office = $${values.length}
        `;

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Settings not found for this office" },
        { status: 404 },
      );
    }

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

export const createSettingsHandlers = (office: "lahore" | "karachi") => ({
  GET: () => getSettings(office),
  PUT: (req: NextRequest) => putSettings(req, office),
});

export const { GET, PUT } = createSettingsHandlers("lahore");

export const revalidate = 0;
