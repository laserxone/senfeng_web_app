import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function POST(req) {
    let { number } = await req.json()

    try {
        if (!number) {
            return NextResponse.json({ message: "Number missing" }, { status: 200 })
        }

        const trimmedNumber = number.trim();

        const paymentQuery = `
            SELECT id, part_id, note 
            FROM customer_parts_karachi 
            WHERE note = $1
        `;
        const paymentResult = await pool.query(paymentQuery, [trimmedNumber]);

        if (paymentResult.rows.length === 0) {
            return NextResponse.json([], { status: 200 });
        }


        const partIds = paymentResult.rows.map(row => row.machine_id);

        const saleQuery = `
            SELECT * FROM savedinvoices_karachi 
            WHERE id = ANY($1)
            LIMIT 1
        `;
        const saleResult = await pool.query(saleQuery, [partIds]);

        const response = paymentResult.rows.map(paymentRow => ({
            ...paymentRow,
            saleData: saleResult.rows.filter(saleRow => saleRow.id === paymentRow.part_id),
            errorMessage : 'Payment TID already exists'
        }));

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
    }

}

export const revalidate = 0