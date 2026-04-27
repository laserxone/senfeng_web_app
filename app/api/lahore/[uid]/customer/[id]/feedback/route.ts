import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

    const { id } = await params

    try {

        const feedback = await pool.query(
            `SELECT f.*, 
                    COALESCE(u.name, 'NIL') AS user_name 
             FROM feedback f 
             LEFT JOIN users u ON f.user_id = u.id 
             WHERE f.customer_id = $1`,
            [id]
        );



        return NextResponse.json(feedback.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0