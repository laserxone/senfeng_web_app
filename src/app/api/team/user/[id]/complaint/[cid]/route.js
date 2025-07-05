import pool from "@/config/db"
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

    const { cid } = await params

    try {
        const result = await pool.query(`
  SELECT 
  c.*,
  cu.name AS customer_name,
  cu.owner AS customer_owner,
  cu.location AS customer_location,
  cu.address AS customer_address,
  cu.pin AS customer_pin,
  cu.number AS customer_number,
  ou.name AS ownership_name,

  ca.id AS assignment_id,
  ca.engineer_id,
  eu.name AS engineer_name,
  ca.assigned_by,
  au.name AS assigned_by_name,
  ca.created_at AS assignment_created_at,

  COALESCE(
    (
      SELECT json_agg(cl)
      FROM (
        SELECT remark, location, created_at
        FROM complaint_logs
        WHERE complaint_id = c.id
        ORDER BY created_at DESC
      ) cl
    ),
    '[]'
  ) AS logs

FROM complaints c
LEFT JOIN customer cu ON c.customer_id = cu.id
LEFT JOIN users ou ON cu.ownership = ou.id
LEFT JOIN complaint_assignments ca ON c.id = ca.complaint_id
LEFT JOIN users eu ON ca.engineer_id = eu.id
LEFT JOIN users au ON ca.assigned_by = au.id

WHERE c.id = $1;

`, [cid]);
        return NextResponse.json(result.rows[0] || {}, { status: 200 });

    } catch (error) {

        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
    }

}

export const revalidate = 0