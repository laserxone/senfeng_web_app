import pool from "@/config/db"
import { NextResponse } from "next/server"

export async function GET(req) {

    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {

        let query = `
                 SELECT 
        o.*, 
        u.id AS user_id, 
        u.name AS user_name,
        u.email AS user_email,
        COALESCE(json_agg(oi) FILTER (WHERE oi.id IS NOT NULL), '[]') AS order_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
            `;

        const queryParams = [];

        if (start_date && end_date && start_date !== 'null' && end_date !== 'null' && start_date !== 'undefined' && end_date !== 'undefined') {
            query += ` WHERE o.created_at BETWEEN $1 AND $2`;
            queryParams.push(start_date, end_date);
        }

        query += `
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC;
    `;

        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error?.message || 'Error saving data, try again' }, { status: 500 });
    }



}

export async function POST(req) {
    const data = await req.json()
    
    if (!data.user_id || !data.items) {
        return NextResponse.json({ message: "Fields missing" }, { status: 500 })
    }

    try {
        const result = await pool.query(`INSERT INTO orders (user_id, status) VALUES ($1, $2, $3) RETURNING id`, [data.user_id, data.status, data.title])

        const orderId = result.rows[0].id

        for (const item of data.items) {

            const inventory_id = null
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

export const revalidate = 0