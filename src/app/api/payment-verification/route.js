import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET() {

    try {
        const result = await pool.query(`
            SELECT 
  p.*,
  s.customer_id, 
  s.serial_no, 
  s.power, 
  s.source, 
  s.order_no_arr,
  c.name AS customer_name, 
  c.owner AS customer_owner, 
  c.number AS customer_number
FROM payment p
LEFT JOIN sale s ON p.machine_id = s.id
LEFT JOIN customer c ON s.customer_id = c.id
`)

const grouped = groupPaymentsByCustomerMachine(result.rows);
        return NextResponse.json(grouped, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
    }
}



function groupPaymentsByCustomerMachine(data) {
  const customerMap = new Map();

  data.forEach((row) => {
    const {
      customer_id,
      customer_name,
      customer_owner,
      customer_number,
      machine_id,
      serial_no,
      power,
      source,
      order_no,
      ...paymentData
    } = row;

    if (!customerMap.has(customer_id)) {
      customerMap.set(customer_id, {
        customer_id,
        customer_name,
        customer_owner,
        customer_number,
        machines: [],
      });
    }

    const customer = customerMap.get(customer_id);

    let machine = customer.machines.find((m) => m.machine_id === machine_id);

    if (!machine) {
      machine = {
        machine_id,
        serial_no,
        power,
        source,
        order_no,
        payments: [],
      };
      customer.machines.push(machine);
    }

    machine.payments.push({
      ...paymentData,
    });
  });

  return Array.from(customerMap.values());
}

export const revalidate = 0
