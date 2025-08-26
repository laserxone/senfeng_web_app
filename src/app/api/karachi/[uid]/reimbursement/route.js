import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import UploadImageForMobile from "@/lib/uploadImageForMobile";
import { NextResponse } from "next/server"


export async function POST(req) {

    try {
        const { image_base64, ...data } = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        if (image_base64) {
            UploadImageForMobile(image_base64, data.image);
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO reimbursement (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const { rows } = await pool.query(query, values);
        const reimbursement = rows[0];
        const userQuery = `SELECT name FROM users WHERE id = $1;`;
        const userResult = await pool.query(userQuery, [data.submitted_by]);
        const submitted_by_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;

        console.log("data inserted successfully");
        return NextResponse.json({
            message: "Reimbursement added successfully",
            reimbursement: { ...reimbursement, submitted_by_name }
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


export async function GET(req, { params }) {

    const { uid } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get('user')

    try {

        const isAdmin = await checkSuperadmin(uid)

        if (isAdmin) {
            let query = `
    SELECT 
      r.*, 
      u.id AS user_id, 
      u.name AS submitted_by_name
    FROM reimbursement r
    INNER JOIN users u ON r.submitted_by = u.id
    WHERE u.office = 'karachi'
  `;

            const queryParams = [];

            if (start_date && end_date) {
                query += ` AND r.date BETWEEN $1 AND $2`;
                queryParams.push(start_date, end_date);
            }

            if (user) {
                query += queryParams.length ? ` AND` : ` WHERE`;
                query += ` submitted_by = $${queryParams.length + 1}`;
                queryParams.push(user);
            }

            query += ` ORDER BY r.date DESC;`;

            const result = await pool.query(query, queryParams);
            const reimbursements = result.rows;



            // Now enhance each reimbursement with customer_id, ownership_id, ownership_name
            for (const reimbursement of reimbursements) {
                const title = reimbursement.title;

                // Search customer table using ILIKE
                const customerQuery = `
      SELECT id, ownership, member 
      FROM customer 
      WHERE name ILIKE $1 OR owner ILIKE $1
      LIMIT 1;
    `;
                const customerRes = await pool.query(customerQuery, [`%${title}%`]);

                if (customerRes.rows.length > 0) {
                    const customer = customerRes.rows[0];
                    reimbursement.customer_id = customer.id;
                    reimbursement.customer_member = customer.member
                    reimbursement.customer = reimbursement.title
                    reimbursement.ownership_id = customer.ownership;

                    // Now fetch ownership_name from users table
                    const ownerQuery = `SELECT name FROM users WHERE id = $1 LIMIT 1;`;
                    const ownerRes = await pool.query(ownerQuery, [customer.ownership]);

                    if (ownerRes.rows.length > 0) {
                        reimbursement.ownership_name = ownerRes.rows[0].name;
                    } else {
                        reimbursement.ownership_name = null;
                    }
                } else {
                    reimbursement.customer_id = null;
                    reimbursement.ownership_id = null;
                    reimbursement.ownership_name = null;
                }
            }

            return NextResponse.json(reimbursements, { status: 200 });
        }
        else {
            let query = `
        SELECT 
          r.*, 
          u.id AS user_id, 
          u.name AS submitted_by_name
        FROM reimbursement r
        INNER JOIN users u ON r.submitted_by = u.id
        WHERE u.id = $1 AND u.office = 'karachi'
      `;

            const queryParams = [uid];

            if (start_date && end_date) {
                query += ` AND r.date BETWEEN $2 AND $3`;
                queryParams.push(start_date, end_date);
            }

            query += ` ORDER BY r.date DESC;`;

            const result = await pool.query(query, queryParams);
            return NextResponse.json(result.rows, { status: 200 });
        }



    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}


export const revalidate = 0