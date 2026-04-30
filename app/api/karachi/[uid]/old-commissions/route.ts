import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";


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
  u.id AS sold_by_id,
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
    } catch (error:any) {
        console.error("GET error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }

}

export async function POST(req:NextRequest) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO commissions (${fields.join(", ")})
        VALUES (${placeholders})
    `;

        await pool.query(query, values);

        return NextResponse.json({
            message: "Data added successfully",
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding Data' }, { status: 500 })
    }
}


function groupByCustomer(rows:any) {
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
      sold_by_id,
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
      (m:any) => m.sale_id === sale_id
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
        sold_by_id,
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
      (a:any, b:any) => new Date(a.contract_date).getTime() - new Date(b.contract_date).getTime()
    );
  }

  return Array.from(customerMap.values());
}



export const revalidate = 0