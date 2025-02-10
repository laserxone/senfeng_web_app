import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {

    const { id } = await params

    try {
        // 1. Get customer data with ownership from users table
        const customerQuery = `
            SELECT c.*, u.name AS ownership_name
            FROM customer c
            LEFT JOIN users u ON c.ownership = u.id
            WHERE c.id = $1
        `;
        const customerResult = await pool.query(customerQuery, [id]);
    
        if (customerResult.rows.length === 0) {
            return NextResponse.json({ message: "Customer not found" }, { status: 404 });
        }
    
        const customer = customerResult.rows[0];
    
        // 2. Get all machines related to this customer
        const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 ORDER BY created_at ASC`;
        const machinesResult = await pool.query(machinesQuery, [id]);
    
        const machines = machinesResult.rows;
    
        // 3. Get all payments related to these machines & calculate total received
        const machineIds = machines.map(m => m.id); // Extract machine IDs
    
        let billReceived = 0;
        if (machineIds.length > 0) {
            const paymentsQuery = `SELECT SUM(amount) AS total_received FROM payment WHERE machine_id = ANY($1)`;
            const paymentsResult = await pool.query(paymentsQuery, [machineIds]);
            billReceived = paymentsResult.rows[0].total_received || 0;
        }
    
        // 4. Calculate total price of all machines
        const billTotal = machines.reduce((sum, machine) => sum + (Number(machine.price) || 0), 0);
    
        // 5. Attach machines & calculated values to customer object
        customer.machines = machines;
        customer.bill_received = parseFloat(billReceived);
        customer.bill_total = parseFloat(billTotal);
    
        return NextResponse.json(customer, { status: 200 });
    
    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
    

}

export const revalidate = 0