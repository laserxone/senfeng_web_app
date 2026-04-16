import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function POST(req, { params }) {
    const { from, vehicle_no, driver_name, manager, received_by, items } = await req.json();
    const { uid } = await params


    try {
        //check quantity

        if (items && items.length > 0) {
            for (const item of items) {
                if (item.inventory_id) {
                    const available = await pool.query(`SELECT qty, name FROM inventory_karachi WHERE id = $1`, [item.inventory_id])
                    const availableQty = available.rows[0]
                    if (Number(item.qty) > Number(availableQty.qty)) {
                        return NextResponse.json({ newQty: Number(availableQty.qty), inventory_id: item.inventory_id, message : `Quantity exceeded for ${availableQty.name}! Try again` }, { status: 200 })
                    }

                }
            }
        }

        // Insert gatepass
        const gatepassid = await pool.query(
            `INSERT INTO outward_gatepass_karachi (from_by, vehicle_no, driver_name, manager, received_by, user_id, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [from, vehicle_no, driver_name, manager, received_by, uid, JSON.stringify(items)]
        );

        // Update inventory
        if (items && items.length > 0) {
            for (const item of items) {
                if (item.inventory_id) {
                    await pool.query(
                        `UPDATE inventory_karachi SET qty = qty - $1 WHERE id = $2`,
                        [item.qty, item.inventory_id]
                    );
                }
            }
        }

        return NextResponse.json({ id: gatepassid.rows[0].id }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error?.message || "Error saving data" },
            { status: 500 }
        );
    }
}
