import pool from "@/config/db";
import { NextResponse } from "next/server";



export async function GET(req, { params }) {


    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        const customersResult = await pool.query(
            `SELECT DISTINCT customer.*
      FROM customer
      INNER JOIN sale ON sale.customer_id = customer.id
      WHERE customer.ownership = $1`,
            [id]
        );

        const customers = customersResult.rows;

        const customersWithFeedback = [];
        const customersWithoutFeedback = [];

        // Step 2: For each customer, get latest feedback in the date range
        for (const customer of customers) {
            const feedbackResult = await pool.query(
                `
        SELECT * FROM feedback
        WHERE customer_id = $1
          AND created_at BETWEEN $2 AND $3
        ORDER BY created_at DESC
        LIMIT 1
        `,
                [customer.id, start_date, end_date]
            );

            if (feedbackResult.rows.length > 0) {
                customersWithFeedback.push({
                    customer,
                    latestFeedback: feedbackResult.rows[0],
                });
            } else {
                customersWithoutFeedback.push(customer);
            }
        }
        return NextResponse.json(customersWithoutFeedback, { status: 200 })

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0