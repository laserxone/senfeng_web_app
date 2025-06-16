import pool from "@/config/db";
import { addLog } from "@/lib/addLog";
import { generateLog } from "@/lib/generateLog";
import { NextResponse } from "next/server"


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
        RETURNING id
    `;

       const result = await pool.query(query, values);
        if (data?.customer_id) {
            await pool.query(`UPDATE customer SET member = TRUE WHERE id = $1`, [data.customer_id])
        }

        const logMSG = generateLog(data, "New Machine added")

        addLog({ text: logMSG, user_id: data.sell_by, customer_id: data?.customer_id || null, sale_id : result.rows[0].id  })

        console.log("data inserted successfully");
        return NextResponse.json({ message: "Inserted successfully" }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}

export const revalidate = 0