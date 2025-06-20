import pool from "@/config/db"
import { NextResponse } from "next/server";


export async function GET(req, { params }) {
    const { id } = await params

    const searchParams = req.nextUrl.searchParams
    const targetDesignation = searchParams.get('for')


    let query = ""
    try {

        if (targetDesignation === 'Engineer') {
            query = `
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
`
        } else {
            query = `
                SELECT 
  c.id AS complaint_id,
  c.title AS complaint_title,
  c.status AS complaint_status,
  ca.id AS assignment_id,
  ca.engineer_id,
  ca.assigned_by,
  au.name AS assigned_by_name,
  ab.name AS engineer_name,
  cust.name AS customer_name,
  cust.owner AS customer_owner,
  cust.ownership
FROM complaints c
LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id
LEFT JOIN users au ON ca.assigned_by = au.id
LEFT JOIN users ab ON ca.engineer_id = ab.id
JOIN customer cust ON c.customer_id = cust.id
WHERE cust.ownership = $1
  AND c.status != 'completed'`
        }



        const result = await pool.query(query, [id])


        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
    }

}

export const revalidate = 0