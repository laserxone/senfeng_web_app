import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET() {

    try {
        const query = `
        SELECT 
    oi.id,
    oi.machine_serial,
    oi.machine_model,
    oi.machine_power,
    oi.machine_source,
    oi.booked,
    oi.booking_date,
    oi.status,
    oi.booked_by,
    u.name AS booked_by_name,
    oi.customer_id,
    c.name AS customer_name,
    c.owner AS customer_owner,
    c.number AS customer_number,
    o.status AS order_status
FROM order_items oi
LEFT JOIN users u ON oi.booked_by = u.id
LEFT JOIN customer c ON oi.customer_id = c.id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE oi.is_machine IS TRUE
ORDER BY oi.id DESC;
`

        const result = await pool.query(query)

        return NextResponse.json(result.rows, { status: 200 })

    } catch (error:any) {
        return NextResponse.json({ message: error?.message || "Failed to fetch data" }, { status: 500 })
    }
}