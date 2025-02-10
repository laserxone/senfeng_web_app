import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params; // Machine ID

  try {
    // 1. Get the machine and its customer ID
    const machineQuery = `SELECT * FROM sale WHERE id = $1`;
    const machineResult = await pool.query(machineQuery, [id]);

    if (machineResult.rows.length === 0) {
      return NextResponse.json({ message: "Machine not found" }, { status: 404 });
    }

    const machine = machineResult.rows[0];
    const customerId = machine.customer_id;

    // 2. Get customer details
    const customerQuery = `SELECT * FROM customer WHERE id = $1`;
    const customerResult = await pool.query(customerQuery, [customerId]);

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const customer = customerResult.rows[0];

    // 3. Get all payments related to this machine, ordered by transaction_date
    const paymentsQuery = `SELECT * FROM payment WHERE machine_id = $1 ORDER BY transaction_date ASC`;
    const paymentsResult = await pool.query(paymentsQuery, [id]);

    // 4. Add track number to each payment
    const payments = paymentsResult.rows.map((payment, index) => ({
      ...payment,
      track: index + 1, // Starts from 1
    }));

    // 5. Attach payments to the machine object
    machine.payments = payments;

    return NextResponse.json({ customer, machine }, { status: 200 });

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
  }
}

export const revalidate = 0