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
      `;

            const queryParams = [];

            if (start_date && end_date) {
                query += ` WHERE r.date BETWEEN $1 AND $2`;
                queryParams.push(start_date, end_date);
            }

            if (user) {
                query += ` AND submitted_by = $3`;
                queryParams.push(user);
            }


            query += ` ORDER BY r.date DESC;`;

            const result = await pool.query(query, queryParams);
            return NextResponse.json(result.rows, { status: 200 });
        } else {
            let query = `
        SELECT 
          r.*, 
          u.id AS user_id, 
          u.name AS submitted_by_name
        FROM reimbursement r
        INNER JOIN users u ON r.submitted_by = u.id
        WHERE u.id = $1
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