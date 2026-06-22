import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {

    const searchParams = req.nextUrl.searchParams
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const { uid } = await params

    try {

        const queryParams = [];
        let query = "";

        const userQuery = await pool.query(`SELECT complaint_assigned FROM users WHERE id = $1`, [uid]);
        const user = userQuery.rows[0];

        if (user.complaint_assigned) {
            query = `
        SELECT 
          c.*,
          c.id AS complaint_id,
          c.title AS complaint_title,
          c.problem AS complaint_problem,
          c.solution AS complaint_solution,
          c.status AS complaint_status,
          c.paid AS complaint_paid,
          c.installation AS complaint_installation,
          c.charges AS complaint_charges,
          c.created_at AS complaint_created_at,
          c.customer_id,
          cu.name AS customer_name,
          cu.address AS customer_address,
          cu.location AS customer_location,
          cu.owner AS customer_owner,
          cu.number AS customer_number,
          cu.pin AS customer_pin,
          cu.ownership AS customer_ownership_id,
          owner_user.name AS customer_ownership_name,
          ca.id AS assignment_id,
          ca.engineer_id,
          engineer.name AS engineer_name,
          ca.assigned_by,
          assigned_by_user.name AS assigned_by_name,
          ca.created_at AS assignment_created_at,
          COALESCE((
            SELECT json_agg(cl)
            FROM (
              SELECT remark, location, created_at, signature, image
              FROM complaint_logs
              WHERE complaint_id = c.id
              ORDER BY created_at DESC
            ) cl
          ), '[]') AS logs,
          COALESCE((
  SELECT json_agg(cp)
  FROM (
    SELECT
      id,
      complaint_id,
      amount,
      purpose,
      method,
      slip,
      created_at
    FROM complaint_payments
    WHERE complaint_id = c.id
    ORDER BY created_at DESC
  ) cp
), '[]') AS payment_details
        FROM complaints c
        LEFT JOIN customer cu ON c.customer_id = cu.id
        LEFT JOIN users owner_user ON cu.ownership = owner_user.id
        
        LEFT JOIN LATERAL (
  SELECT *
  FROM complaint_assignments ca
  WHERE ca.complaint_id = c.id
  ORDER BY ca.created_at DESC
  LIMIT 1
) ca ON true
 
        LEFT JOIN users engineer ON ca.engineer_id = engineer.id
        LEFT JOIN users assigned_by_user ON ca.assigned_by = assigned_by_user.id
        WHERE c.customer_id IS NOT NULL AND c.managing_office = 'karachi'
      `;

            if (start && end) {
                const paramIndex = queryParams.length + 1;
                query += ` AND c.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
                queryParams.push(start, end);
            }

            query += ` ORDER BY c.created_at DESC`;
        } else {
            return NextResponse.json([])
        }
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }

}