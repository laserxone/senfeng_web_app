import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const user = searchParams.get("user");

  const office = "lahore";

  let whereClause = ``;
  const queryParams = [start_date, end_date];

  if (user) {
    whereClause += ` AND COALESCE(c.ownership, s.sell_by) = $3`;
    queryParams.push(user);
  } else {
    whereClause += ` AND c.office = $3`;
    queryParams.push(office)
  }

  try {
    const query = `
     SELECT
        s.id AS machine_id,
        s.price AS total_generated,
        s.speed_money_amount AS machine_speed_money_amount,
        s.speed_money AS machine_speed_money,
        s.serial_no AS machine_serial_no,
        s.sell_by,
        s.contract_date AS machine_contract_date,
        c.id AS customer_id,
        c.name AS customer_name,
        c.owner AS customer_owner,
        c.ownership,
        c.office,
        COALESCE(ownership_user.name, sell_user.name) AS sell_by_name,
        COALESCE(ownership_user.id, sell_user.id) AS sell_id
    FROM sale s
    LEFT JOIN customer c ON c.id = s.customer_id
    LEFT JOIN users sell_user ON sell_user.id = s.sell_by
    LEFT JOIN users ownership_user ON ownership_user.id = c.ownership
    WHERE s.contract_date BETWEEN $1 AND $2
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
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
