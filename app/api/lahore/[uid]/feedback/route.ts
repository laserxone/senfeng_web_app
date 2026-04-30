import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server"


export async function GET(req:NextRequest, { params }:{params:Promise<{uid:string}>}) {

    const { uid } = await params;
    const searchParams = req.nextUrl.searchParams;
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const member = searchParams.get("member");



    try {
        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {
            const query = `
SELECT 
    f.*, 
    c.id AS customer_id, 
    c.name AS customer_name, 
    c.owner AS customer_owner,
    u.id AS user_id,
    u.name AS user_name
FROM feedback f
LEFT JOIN customer c ON f.customer_id = c.id
LEFT JOIN users u ON f.user_id = u.id
WHERE u.office = 'lahore'
ORDER BY created_at DESC;

    `;

            const result = await pool.query(query);
            return NextResponse.json(result.rows, { status: 200 })

        } else {
            const userQuery = await pool.query("SELECT limited_access FROM users WHERE id = $1", [uid])
            const user = userQuery.rows[0]


            const limitedAccess = user.limited_access

            let queryParams = [];
            let conditions = [];


            let query = `
    SELECT 
      feedback.id,
      feedback.customer_id,
      feedback.created_at AS feedback_date,
      feedback.status,
      feedback.feedback,
      customer.id AS customer_id,
      users.name AS user_name,
      customer.name,
      customer.owner,
      customer.location,
      customer.number,
      customer.ownership,
    u2.name AS ownership_name,
      customer.created_at AS customer_created_at
    FROM feedback
    LEFT JOIN customer ON feedback.customer_id = customer.id
    LEFT JOIN users ON feedback.user_id = users.id
    LEFT JOIN users u2 ON customer.ownership = u2.id
  `;

            if (limitedAccess) {
                conditions.push(`feedback.user_id = $${queryParams.length + 1}`);
                queryParams.push(uid);
            }

            if (member === 'TRUE') {
                conditions.push(`member IS TRUE`)
            } else if (member === 'FALSE') {
                conditions.push(`member IS FALSE`)
            }

            if (start_date && end_date) {
                conditions.push(`feedback.created_at BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
                queryParams.push(start_date, end_date);
            }

            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }

            query += " ORDER BY feedback.created_at ASC;";

            const result = await pool.query(query, queryParams);
            return NextResponse.json(result.rows, { status: 200 });

        }

    } catch (error:any) {
        console.error('Error ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export async function POST(req:NextRequest) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);

        // Check and process next_followup
        if (data.next_followup) {
            const nextFollowupDate = moment(data.next_followup);
            const twoWeeksLater = moment().add(2, 'weeks');

            if (nextFollowupDate.isValid() && nextFollowupDate.isBefore(twoWeeksLater)) {
                data.followup_type = "weekly";
            } else {
                data.followup_type = "monthly";
            }

            // Ensure followup_type is added to fields and values
            if (!fields.includes("followup_type")) {
                fields.push("followup_type");
                values.push(data.followup_type);
            }
        }

        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
            INSERT INTO feedback (${fields.join(", ")})
            VALUES (${placeholders})
            `;

        await pool.query(query, values);

        console.log("Data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0