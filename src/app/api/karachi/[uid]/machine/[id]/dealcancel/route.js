import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function POST(req, { params }) {

    const { uid, id } = await params

    const {reason} = await req.json()

    try {
        if (!uid || !id || !reason) {
            return NextResponse.json({ message: "Parameters missing" }, { status: 400 })
        }

        await pool.query(
            `INSERT INTO cancelled_machine (machine_id, reason) VALUES ($1, $2)`,
            [id, reason]
        );

        await pool.query(
            `UPDATE order_items 
       SET booked_by = $1, 
           booking_date = $2, 
           booked = $3, 
           customer_id = $4 
       WHERE machine_id = $5`,
            [null, null, false, null, id]
        );

        return NextResponse.json({ message: "Done" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error?.message }, { status: 500 })
    }

}