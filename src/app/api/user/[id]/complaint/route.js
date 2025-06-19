import pool from "@/config/db"
import { NextResponse } from "next/server";


export async function GET(req, { params }) {
    const { id } = await params

    try {
        const result = await pool.query(`
  SELECT 
    ca.*,
    c.title AS complaint_title,
    c.problem AS complaint_problem,
    c.solution AS complaint_solution,
    c.status AS complaint_status,
    c.created_at AS complaint_created_at,
    au.name AS assigned_by_name
  FROM complaint_assignments ca
  JOIN complaints c ON ca.complaint_id = c.id
  LEFT JOIN users au ON ca.assigned_by = au.id
  WHERE ca.engineer_id = $1
    AND c.status != 'completed'
`, [id]);


        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {

        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
    }

}

export const revalidate = 0