import pool from "@/config/db";
import { addLog } from "@/lib/addLog";
import { generateLog } from "@/lib/generateLog";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToCRM, sendNotificationToCRMWithoutLead } from "@/lib/sendNotificationToCRM";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;

    const member = searchParams.get("member");
    const machinesQuery = searchParams.get("machines");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    const userQuery = await pool.query(
        `SELECT id, designation, limited_access FROM users WHERE id = $1`,
        [id]
    );
    const user = userQuery.rows[0];

    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 500 });
    }

    let query = "";
    const queryParams = [];

    query = `
    SELECT 
      c.id,
      c.name,
      c.owner,
      c.ownership,
      c.number,
      c.industry,
      c.location,
      c.customer_group,
      c.created_at,
      c.lead,
      c.member,
      COALESCE(u.name, '') AS ownership_name
      ${machinesQuery ? `,
      COALESCE(json_agg(s.serial_no) FILTER (WHERE s.serial_no IS NOT NULL), '[]') AS machines` : ''}
    FROM customer c
    LEFT JOIN users u ON c.ownership = u.id
    ${machinesQuery ? 'LEFT JOIN sale s ON c.id = s.customer_id' : ''}
  `;

    let whereClauses = [];

    if (user.limited_access) {
        if (
            user.designation === 'Social Media Manager' ||
            user.designation === 'Customer Relationship Manager'
        ) {
            whereClauses.push(`c.lead = $${queryParams.length + 1}`);
            queryParams.push(id);
        } else if (user.designation === 'Sales') {
            whereClauses.push(`c.ownership = $${queryParams.length + 1}`);
            queryParams.push(id);
        }
    }

    if (member === "true") {
        whereClauses.push("c.member IS TRUE");
    } else  {
        whereClauses.push("c.member IS FALSE");
    }

    if (machinesQuery && start_date && end_date) {
        whereClauses.push(`s.contract_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
        queryParams.push(start_date, end_date);
    }

    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }

    query += `
    GROUP BY c.id, u.name
    ORDER BY c.name ASC
  `;

    try {
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export async function POST(req, { params }) {

    const { id } = await params

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO customer (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;




        const result = await pool.query(query, values);



        if (result.rows[0].lead) {
            sendNotificationToCRM(result.rows[0].lead, `${result.rows[0]?.name}-${result.rows[0]?.owner}`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`)
        }

        if (result.rows[0]?.lead !== result.rows[0].created_by) {
            sendNotificationToCRMWithoutLead(`${result.rows[0]?.name}-${result.rows[0]?.owner}`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`)
        }

        if (result.rows[0].ownership) {
            sendNotification(`${result.rows[0]?.name}-${result.rows[0]?.owner} assigned to you`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`, result.rows[0].ownership)
            sendNotificationToMobile(`${result.rows[0]?.name}-${result.rows[0]?.owner} assigned to you`, "Customer", result.rows[0].ownership, result.rows[0], "client", `/dashboard/customer/${result.rows[0].id}`)
        }

        try {
            const logMSG = generateLog(data, "New customer added")

            addLog({ text: logMSG, user_id: id, customer_id: result.rows[0].id })

        } catch (error) {
            console.log(error)
        }

        return NextResponse.json({ message: "Inserted successfully", data: result.rows[0] }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error?.message || 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0