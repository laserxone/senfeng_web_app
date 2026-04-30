import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(req:NextResponse, { params }:{ params: Promise<{ id: string }> }) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM commissions WHERE id = $1`, [id]);


    return NextResponse.json({ message: "Commission Deleted" }, { status: 200 });
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
          UPDATE commissions 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING *
      `;

    const response = await pool.query(query, values);

    if (data.is_approved === true) {
      sendNotification("Your commission is approved", "commission", response.rows[0].user_id)
    } else if (data.is_approved === false) {
      sendNotification("Your commission is rejected", "commission", response.rows[0].user_id)
    }

    // Step 4: Add notifications to Firestore



    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0