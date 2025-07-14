import {karachi_pool as pool} from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, {params}) {

    const searchParams = req.nextUrl.searchParams;
    const expiry = searchParams.get('expiry');
   
    const queryParams = [];
    let conditions = [];

    if (expiry) {
        conditions.push(`now() BETWEEN start_date AND end_date`);
    }

   
    let query = `SELECT * FROM news`;
    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY id ASC`;

    try {
        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message || "Error occurred" },
            { status: 500 }
        );
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
        INSERT INTO news (${fields.join(", ")})
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