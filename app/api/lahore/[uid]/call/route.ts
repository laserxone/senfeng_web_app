import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {


    const { uid } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
       const customersResult = await pool.query(
  `SELECT DISTINCT customer.id, customer.name, customer.ownership, customer.number, customer.owner
   FROM customer
   INNER JOIN sale ON sale.customer_id = customer.id
   WHERE customer.ownership = $1`,
  [uid]
);

        const customers = customersResult.rows;

        const customersWithFeedback = [];
        const customersWithoutFeedback = [];

        
        for (const customer of customers) {
            const feedbackResult = await pool.query(
                `
                 SELECT id, user_id, created_at, customer_id FROM feedback
                WHERE customer_id = $1
                AND user_id = $2
                AND created_at BETWEEN $3 AND $4
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [customer.id, uid, start_date, end_date]
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

    } catch (error : any) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0