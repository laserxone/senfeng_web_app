import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req:NextRequest, { params }:{params:Promise<{id:string}>}) {

    const { id } = await params

    try {

        const visit = await pool.query(`
    SELECT 
    r.*, 
    u.id AS user_id, 
    u.name AS user_name,
      c.name AS customer_name,
     c.owner AS customer_owner,
    c.location AS customer_location,
    c.number AS customer_number,
    c.member AS customer_member,
      c.id AS customer_id
FROM visit r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN customer c ON r.customer_id = c.id
WHERE r.customer_id = $1
    `, [id]);

        return NextResponse.json(visit.rows, { status: 200 })
    } catch (error:any) {
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0