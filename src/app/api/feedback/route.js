import pool from "@/config/db";
import { NextResponse } from "next/server"


// export async function POST(req) {

//     const { data } = await req.json();
//     const client = await pool.connect();

//     try {
//         for (const item of data) {
//             // Lookup user ID using email
//             const userQuery = `SELECT id FROM customer WHERE old_ref = $1`;
//             const userResult = await client.query(userQuery, [item.clientID]);

//             let clientId = userResult.rows.length ? userResult.rows[0].id : null;

//             const query = `
//                 INSERT INTO feedback(
//                     created_at, customer_id, note, status
//                 )
//                 VALUES (
//                     TO_TIMESTAMP($1 / 1000.0), $2, $3, $4
//                 )
//             `;

//             const values = [
//                 Number(item.TimeStamp),
//                 clientId, 
//                 item.note, 
//                 item.status,
//             ];

//             await client.query(query, values);
//         }

//         console.log('Feedback data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting reimbursement data:', error);
//     } finally {
//         client.release();
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }



export async function GET(req) {

    try {
        const query = `
SELECT 
    f.*, 
    c.id AS customer_id, 
    c.name AS customer_name
FROM feedback f
LEFT JOIN customer c ON f.customer_id = c.id
ORDER BY created_at DESC;

    `;

        const result = await pool.query(query);
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0