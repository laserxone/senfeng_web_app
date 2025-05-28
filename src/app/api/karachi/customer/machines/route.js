import {karachi_pool as pool} from "@/config/db";
import { NextResponse } from "next/server"

export async function GET(req) {


    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get("user")

    console.log(start_date, end_date, user)

    const queryParams = []

    try {
        let query = `
        SELECT 
          c.*, 
          COALESCE(u.name, '') AS ownership_name,
          COALESCE(json_agg(s.serial_no) FILTER (WHERE s.serial_no IS NOT NULL), '[]') AS machines
        FROM customer c
        LEFT JOIN sale s ON c.id = s.customer_id
        LEFT JOIN users u ON c.ownership = u.id
        
      `;

        if (start_date && end_date) {
            query += ` WHERE s.contract_date BETWEEN $1 AND $2`
            queryParams.push(start_date, end_date)
        }

        if (user) {
            query += ` AND c.ownership = $3`
            queryParams.push(user)
        }

      query += ` GROUP BY c.id, u.name`

        let result
        if (queryParams.length > 0) {
            result = await pool.query(query, queryParams);
        } else {
            result = await pool.query(query)
        }

        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export async function POST(req) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
      INSERT INTO sale (${fields.join(", ")})
      VALUES (${placeholders})
  `;

        await pool.query(query, values);

        console.log("data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0