import pool from "@/config/db";
import { NextResponse } from "next/server"


// export async function POST(req) {
//     const { data } = await req.json()
//     const client = await pool.connect();



//     try {
//         for (const item of data) {
//             const query = `
//           INSERT INTO customer(
//                     name, email, "group", industry, location, number, owner, ownership, old_ref, created_at
//                 )
//                 VALUES(
//                     $1, $2, $3, $4, $5, $6, $7, $8, $9, TO_TIMESTAMP($10 / 1000.0)
//                 )
//           `;
//             const values = [
//                 item.company, // name
//                 item.email,    // email
//                 item.group,    // group
//                 item.industry, // industry
//                 item.location, // location
//                 item.number,   // number
//                 item.owner,    // owner
//                 null,
//                 item.id,       // old_ref
//                 Number(item.TimeStamp) // created_at (in milliseconds)
//             ];

//             await client.query(query, values);
//         }

//         console.log('Customer data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting data: ', error);
//     } finally {
//         client.release()
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }

export async function GET(req) {



    try {
        const query = `
      SELECT 
        c.*, 
        COALESCE(json_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '[]') AS machines
      FROM customer c
      LEFT JOIN sale s ON c.id = s.customer_id
      GROUP BY c.id
    `;

        const result = await pool.query(query);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({message : error.message || "Something went wrong"}, { status: 500 })
    }

}

export const revalidate = 0