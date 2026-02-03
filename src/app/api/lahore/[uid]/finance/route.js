import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const user = searchParams.get("user");

  const office = "lahore";

  let whereClause = ` AND s.contract_date BETWEEN $2 AND $3`;
  const queryParams = [office, start_date, end_date];

  if (user) {
    // If user exists, add additional filter
    whereClause += ` AND u.id = $4`;
    queryParams.push(user);
  }

  try {
    const query = `
    SELECT
        s.id AS machine_id,
        s.speed_money_amount AS machine_speed_money_amount,
        s.speed_money AS machine_speed_money,
        s.serial_no AS machine_serial_no,
        s.price AS total_generated,
        s.sell_by,
        c.name AS customer_name,
        c.id AS customer_id,
        c.owner AS customer_owner,
         u.name AS sell_by_name
    FROM sale s
    
    LEFT JOIN users u ON u.id = s.sell_by
    LEFT JOIN customer c ON c.id = s.customer_id
    WHERE u.office = $1
    AND NOT EXISTS (
        SELECT 1
        FROM cancelled_machine cm
        WHERE cm.machine_id = s.id
    ) ${whereClause}
  `;

    const { rows: sales } = await pool.query(query, queryParams);

    const machineIds = sales.map((s) => s.machine_id);
    let payments = [];
    if (machineIds.length > 0) {
      const paymentQuery = `
      SELECT *
      FROM payment
      WHERE machine_id = ANY($1)
    `;
      const { rows: paymentRows } = await pool.query(paymentQuery, [
        machineIds,
      ]);
      payments = paymentRows;
    }

    const normalizedSales = sales.map((sale) => {
      const salePayments = payments.filter(
        (p) => p.machine_id === sale.machine_id,
      );
      const totalPaymentReceived = salePayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const speedMoneyDeduction = sale.speed_money
        ? sale.speed_money_amount
          ? Number(sale.speed_money_amount)
          : 0
        : 0;
      const balance =
        Number(sale.total_generated) -
        totalPaymentReceived -
        speedMoneyDeduction;
      const pending = balance > 0 ? balance : 0;

      return {
        ...sale,
        payments: salePayments,
        total_payment_received: totalPaymentReceived,
        total_balance: balance,
        pending,
      };
    });

    const pendingMachines = normalizedSales.filter((sale) => sale.pending > 0);

    return NextResponse.json(pendingMachines, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Error filtering data" },
      { status: 500 },
    );
  }
}
