import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function DELETE(req, { params }) {
  try {

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }
    await pool.query(`DELETE FROM reimbursement WHERE id = $1`, [id]);


    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message ||"Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0