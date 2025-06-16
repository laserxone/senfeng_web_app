import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET() {

    try {
        const result = await pool.query(`
      SELECT 
  s.id AS sale_id,
  s.customer_id,
  s.serial_no,
  s.power,
  s.source,
  s.order_no_arr,
  s.contract_date,
  s.price,
  s.speed_money,
  s.speed_money_note,
  s.speed_money_amount,
  u.name AS sold_by_name,
  cu.name AS customer_name,
  cu.owner AS customer_owner,
  cu.number AS customer_number,
  owner_user.name AS customer_owner_name
FROM sale s
INNER JOIN customer cu ON s.customer_id = cu.id
INNER JOIN payment p ON p.machine_id = s.id
LEFT JOIN commissions com ON com.sale_id = s.id
LEFT JOIN users u ON s.sell_by = u.id
LEFT JOIN users owner_user ON cu.ownership = owner_user.id
WHERE com.sale_id IS NULL
    `);

        const groupedData = groupByCustomer(result.rows);

        return NextResponse.json(groupedData, { status: 200 });
    } catch (error) {
        console.error("GET error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }

}

export async function POST() {

}


function groupByCustomer(rows) {
  const customerMap = new Map();

  for (const row of rows) {
    const {
      customer_id,
      customer_name,
      customer_owner,
      customer_owner_name,
      customer_number,
      sale_id,
      serial_no,
      power,
      source,
      contract_date,
      order_no_arr,
      sold_by_name,
      price,
      speed_money,
      speed_money_note,
      speed_money_amount,
    } = row;

    // Initialize customer if not already added
    if (!customerMap.has(customer_id)) {
      customerMap.set(customer_id, {
        customer_id,
        customer_name,
        customer_owner,
        customer_owner_name,
        customer_number,
        machines: [],
      });
    }

    const customer = customerMap.get(customer_id);

    // Prevent duplicate machine (sale_id)
    const machineExists = customer.machines.some(
      (m) => m.sale_id === sale_id
    );

    if (!machineExists) {
      customer.machines.push({
        sale_id,
        serial_no,
        power,
        source,
        order_no_arr,
        contract_date,
        sold_by_name,
        price,
        speed_money,
        speed_money_note,
        speed_money_amount,
      });
    }
  }

  // Sort machines by contract_date ascending
  for (const customer of customerMap.values()) {
    customer.machines.sort(
      (a, b) => new Date(a.contract_date) - new Date(b.contract_date)
    );
  }

  return Array.from(customerMap.values());
}



export const revalidate = 0