import pool from "@/config/db"
import { NextResponse } from "next/server"



export async function PUT(req, {params}) {
    const item = await req.json();
  
    const { oid } = await params;

    if (!oid) {
        return NextResponse.json({ message: "Missing order item ID" }, { status: 400 });
    }

    const {
        name = "",
        qty = 0,
        price = 0,
        buying_price = 0,
        threshold = 0,
        new_order = 0,
        is_machine = false,
        machine_serial = null,
        machine_model = null,
        machine_source = null,
        machine_power = null,
        inventory_id = null,
        location = "karachi"
    } = item;

   
    try {
        await pool.query(
            `UPDATE order_items SET 
        inventory_id = $1,
        name = $2,
        qty = $3,
        price = $4,
        is_machine = $5,
        machine_serial = $6,
        machine_model = $7,
        machine_source = $8,
        machine_power = $9,
        threshold = $10,
        new_order = $11,
        buying_price = $12,
        location = $13
      WHERE id = $14`,
            [
                inventory_id,
                name,
                qty,
                price,
                is_machine,
                machine_serial,
                machine_model,
                machine_source,
                machine_power,
                threshold,
                new_order,
                buying_price,
                location,
                oid,
                
            ]
        );

        return NextResponse.json({ message: "Order item updated successfully" }, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error?.message || 'Error saving data, try again' }, { status: 500 });
    }



}