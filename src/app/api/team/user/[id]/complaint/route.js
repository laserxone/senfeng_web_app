import pool from "@/config/db"
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

  const { id } = await params

  const userQuery = await pool.query(`SELECT id, designation FROM users WHERE id = $1`, [id])
  const user = userQuery.rows

  let query = ""
  if (!user[0]?.id) {
    return NextResponse.json({ message: "User not found" })
  }

  const queryParams = []

  try {

    if (user.designation === 'Engineer') {
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
    AND c.status != 'completed'`
      queryParams.push(id)
    } else {
      query = `
    SELECT 
    c.*,
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
     COALESCE(
    (
      SELECT json_agg(cl)
      FROM (
        SELECT remark, location, created_at, signature, image
        FROM complaint_logs
        WHERE complaint_id = c.id
        ORDER BY created_at DESC
      ) cl
    ),
    '[]'
  ) AS logs
  FROM complaints c
  LEFT JOIN customer cu ON c.customer_id = cu.id
  LEFT JOIN users owner_user ON cu.ownership = owner_user.id
  LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id
  LEFT JOIN users engineer ON ca.engineer_id = engineer.id
  LEFT JOIN users assigned_by_user ON ca.assigned_by = assigned_by_user.id
  ORDER BY c.created_at DESC
    `
    }
    const result = await pool.query(query, queryParams);


    return NextResponse.json(result.rows, { status: 200 })
  }
  catch (error) {
    console.log(error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }

}

export async function POST(req) {
  const data = await req.json()

  try {

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
    INSERT INTO complaints (${fields.join(", ")})
    VALUES (${placeholders})
    RETURNING *
`;

    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message || "Error occured" }, { status: 500 });
  }

}

export async function PUT(req) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields = [];
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

    values.push(id);
    const query = `
            UPDATE complaints 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

    await pool.query(query, values);


    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0