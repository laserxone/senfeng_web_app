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
  s.contract_date,
  c.name AS customer_name, 
  c.owner AS customer_owner, 
  c.number AS customer_number
FROM payment p
LEFT JOIN sale s ON p.machine_id = s.id
LEFT JOIN customer c ON s.customer_id = c.id
`)

const grouped = groupPaymentsByCustomerMachine(result.rows);
        return NextResponse.json(grouped, { status: 200 })
    } catch (error : any) {
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
    }
}



function groupPaymentsByCustomerMachine(data : any) {
  const customerMap = new Map();

  data.forEach((row : any) => {
    const {
      customer_id,
      customer_name,
      customer_owner,
      customer_number,
      machine_id,
      serial_no,
      power,
      source,
      order_no_arr,
      contract_date,
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

    let machine = customer.machines.find((m : any) => m.machine_id === machine_id);

    if (!machine) {
      machine = {
        machine_id,
        serial_no,
        power,
        source,
        order_no_arr,
        contract_date,
        payments: [],
      };
      customer.machines.push(machine);
    }

    machine.payments.push({
      ...paymentData,
    });
  });

  
  const filteredCustomers = Array.from(customerMap.values())
    .map((customer) => {
      const filteredMachines = customer.machines.filter((machine : any) => {
        return machine.payments.some((payment : any) => payment.status !== "approved");
      });

      if (filteredMachines.length === 0) return null;

      filteredMachines.sort(
        (a : any, b : any) => new Date(a.contract_date).getTime() - new Date(b.contract_date).getTime()
      );

      return {
        ...customer,
        machines: filteredMachines,
      };
    })
    .filter((customer) => customer !== null);

  return filteredCustomers;
}


export const revalidate = 0
