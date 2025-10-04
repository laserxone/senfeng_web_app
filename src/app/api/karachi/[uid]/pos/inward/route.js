import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function POST(req, { params }) {
    const { from, vehicle_no, driver_name, manager, received_by, items } = await req.json();
    const {uid} = await params

    console.log(uid)

    try {
        // Insert gatepass
        await pool.query(
            `INSERT INTO inward_gatepass_karachi (from_by, vehicle_no, driver_name, manager, received_by, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [from, vehicle_no, driver_name, manager, received_by, uid]
        );

        // Update inventory
        if (items && items.length > 0) {
            for (const item of items) {
                if (item.existing) {
                    await pool.query(
                        `UPDATE inventory_karachi SET qty = qty + $1 WHERE id = $2`,
                        [item.quantity, item.existing]
                    );
                }
            }
        }

        return NextResponse.json({ message: "Done" }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error?.message || "Error saving data" },
            { status: 500 }
        );
    }
}
