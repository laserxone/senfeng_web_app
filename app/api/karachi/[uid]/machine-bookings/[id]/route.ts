import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(req:NextRequest, { params }:{params:Promise<{id:string}>}) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM order_items WHERE id = $1`, [id]);


    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req:NextRequest, { params }:{params:Promise<{id:string}>}) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields:string[] = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id); // Add ID as the last parameter for WHERE clause
    const query = `
          UPDATE order_items 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    const response = await pool.query(query, values);

    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0