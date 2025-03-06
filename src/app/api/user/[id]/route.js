import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // Fetch user details
    const userQuery = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const user = userQuery.rows[0];

    // Fetch customers where ownership = user.id
    const customersQuery = await pool.query(
      "SELECT * FROM customer WHERE ownership = $1",
      [id]
    );
    const customers = customersQuery.rows;
    const totalCustomers = customers.length;

    // Fetch all sales where customer_id matches the fetched customers
    const customerIds = customers.map((customer) => customer.id);
    let sales = [];
    let totalSales = 0;
    if (customerIds.length > 0) {
      const salesQuery = await pool.query(
        `SELECT * FROM sale WHERE customer_id = ANY($1)`,
        [customerIds]
      );
      sales = salesQuery.rows;
      totalSales = sales.length;
    }

    // Fetch all payments where machine_id matches the fetched sales
    const machineIds = sales.map((sale) => sale.id);
    let payments = [];
    if (machineIds.length > 0) {
      const paymentsQuery = await pool.query(
        `SELECT * FROM payment WHERE machine_id = ANY($1)`,
        [machineIds]
      );
      payments = paymentsQuery.rows;
    }

    // Structure the response
    const responseData = {
      user,
      totalCustomers,
      totalSales,
      customers: customers.map((customer) => ({
        ...customer,
        sales: sales
          .filter((sale) => sale.customer_id === customer.id)
          .map((sale) => ({
            ...sale,
            payments: payments.filter((payment) => payment.machine_id === sale.id),
          })),
      })),
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: error.message },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
