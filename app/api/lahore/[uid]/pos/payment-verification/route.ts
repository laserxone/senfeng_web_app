import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function PUT(req: NextRequest) {
    try {
      const data = await req.json();
      const { id, ...updates } = data;
      delete updates.office;
      delete updates.office_id;

      if (!id) {
        return NextResponse.json(
          { message: "ID is required" },
          { status: 400 },
        );
      }
      if (updates.part_id !== undefined) {
        const invoice = await pool.query(
          `SELECT id FROM savedinvoices WHERE id = $1 AND office = '${office}'`,
          [updates.part_id],
        );
        if (!invoice.rowCount) {
          return NextResponse.json(
            { message: "Invoice does not belong to this office" },
            { status: 409 },
          );
        }
      }

      const fields: any[] = [];
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

      values.push(id);
      const query = `
            UPDATE customer_parts
            SET ${fields.join(", ")}
            WHERE id = $${values.length} AND office = '${office}'
        `;

      await pool.query(query, values);

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
  return { PUT };
};

export const { PUT } = createPosHandlers("lahore");
