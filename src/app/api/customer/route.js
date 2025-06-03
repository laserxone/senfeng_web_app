import pool from "@/config/db";
import { addLog } from "@/lib/addLog";
import { generateLog } from "@/lib/generateLog";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToCRM, sendNotificationToCRMWithoutLead } from "@/lib/sendNotificationToCRM";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
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
        INSERT INTO customer (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;




        const result = await pool.query(query, values);



        if (result.rows[0].lead) {
            sendNotificationToCRM(result.rows[0].lead, `${result.rows[0]?.name || result.rows[0]?.owner}`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`)
        }

        if (result.rows[0]?.lead !== result.rows[0].created_by) {
            sendNotificationToCRMWithoutLead(`${result.rows[0]?.name || result.rows[0]?.owner}`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`)
        }

        if (result.rows[0].ownership) {
            sendNotification(`${result.rows[0]?.owner || result.rows[0]?.name} assigned to you`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`, result.rows[0].ownership)
             sendNotificationToMobile(`${result.rows[0]?.owner || result.rows[0]?.name} assigned to you`,"Customer" ,result.rows[0].ownership, result.rows[0], "client", `/dashboard/customer/${result.rows[0].id}` )
        }

        const logMSG = generateLog(data)

        addLog({ text: logMSG, user_id: result.rows[0].created_by, customer_id: result.rows[0].id })


        return NextResponse.json({ message: "Inserted successfully", data: result.rows[0] }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


export async function GET(req) {

    const searchParams = req.nextUrl.searchParams
    const urlQuery = searchParams.get('withoutsale')
    try {
        if (urlQuery) {

            const result = await pool.query(`
                SELECT 
  customer.*, 
  users.name AS ownership_name
FROM customer
LEFT JOIN users ON customer.ownership = users.id
ORDER BY customer.name ASC;
`)
            return NextResponse.json(result.rows, { status: 200 });
        }
        else {
            const customerQuery = await pool.query(`
                SELECT 
  customer.*, 
  users.name AS ownership_name
FROM customer
LEFT JOIN users ON customer.ownership = users.id
ORDER BY customer.name ASC;
`);
            const customers = customerQuery.rows;

            if (customers.length === 0) {
                return NextResponse.json({ customers: [] }, { status: 200 });
            }

            // Extract customer IDs
            const customerIds = customers.map((customer) => customer.id);

            // Fetch all sales related to the customers
            const salesQuery = await pool.query(
                `SELECT * FROM sale WHERE customer_id = ANY($1)`,
                [customerIds]
            );
            const sales = salesQuery.rows;

            // Map sales back to their respective customers
            const customersWithSales = customers.map((customer) => ({
                ...customer,
                sales: sales.filter((sale) => sale.customer_id === customer.id),
            }));

            return NextResponse.json(customersWithSales, { status: 200 });
        }

    } catch (error) {
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0

