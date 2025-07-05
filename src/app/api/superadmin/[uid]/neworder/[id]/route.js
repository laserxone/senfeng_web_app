import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function POST(req, {params}) {
    const data = await req.json()
    const {id} = await params
    
    if (!data.user_id || !data.items || !id) {
        return NextResponse.json({ message: "Fields missing" }, { status: 500 })
    }

    try {
       
        const orderId = id

        for (const item of data.items) {

            const inventory_id = item.inventory_id || null
            const name = item.name || ""
            const qty = item.qty || 0
            const price = item.price || 0
            const is_machine = item.is_machine || false
            const machine_serial = item.machine_serial || null
            const machine_model = item.machine_model || null
            const machine_source = item.machine_source || null
            const machine_power = item.machine_power || null
            const status = "Order Placed"
            const threshold = item.threshold || 0
            const new_order = item.new_order || 0
            const buying_price = item.buying_price || 0


            await pool.query(
                `INSERT INTO order_items 
          (order_id, inventory_id, name, qty, price, is_machine, machine_serial, machine_model, machine_source, machine_power, status, threshold, new_order, buying_price)
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                    orderId,
                    inventory_id,
                    name,
                    qty,
                    price,
                    is_machine,
                    machine_serial,
                    machine_model,
                    machine_source,
                    machine_power,
                    status,
                    threshold,
                    new_order,
                    buying_price,
                ]
            );
        }

        return NextResponse.json({ message: 'Order created successfully', orderId }, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error?.message || 'Error saving data, try again' }, { status: 500 });
    }



}


export async function DELETE(req, { params }) {

    const { id } = await params

    if (!id) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }
    try {
        await pool.query(`DELETE FROM orders WHERE id = $1`, [id])

        return NextResponse.json({ message: "Delete" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0