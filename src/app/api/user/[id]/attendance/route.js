
import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    console.log(start_date, end_date, id)

    try {
        let query = `
    SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS user_name,
    u.email AS user_email
FROM attendance t
INNER JOIN users u ON t.user_id = u.id
WHERE u.id = $1
    `;
        const queryParams = [id];

        if (start_date && end_date) {
            query += ` AND t.time_in BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }

        query += ` ORDER BY t.time_in DESC;`;
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 });

    } catch (error) {
        console.error('Error: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0