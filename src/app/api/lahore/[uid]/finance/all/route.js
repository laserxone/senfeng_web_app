import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const user = searchParams.get("user");
  const office = "lahore";

  if (!user) {
    return NextResponse.json({ message: "USer missing" }, { status: 400 });
  }

  try {
    const query = `
    SELECT
        s.id AS machine_id,
        s.price AS total_generated,
        s.speed_money_amount AS machine_speed_money_amount,
        s.speed_money AS machine_speed_money,
        s.serial_no AS machine_serial_no,
        s.price AS total_generated,
        s.sell_by,
        c.name AS customer_name,
        c.owner AS customer_owner,
         u.name AS sell_by_name
    FROM sale s
    
    LEFT JOIN users u ON u.id = s.sell_by
    LEFT JOIN customer c ON c.id = s.customer_id
    WHERE u.office = $1 AND s.sell_by = $2
  `;

    const { rows: sales } = await pool.query(query, [office, user]);

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

    const summary = pendingMachines.reduce(
      (acc, sale) => {
        acc.total += Number(sale.total_generated);
        acc.received += Number(sale.total_payment_received);
        acc.pending += Number(sale.pending);
        return acc;
      },
      { total: 0, received: 0, pending: 0 },
    );

    return NextResponse.json(
      {
        summary,
        items: pendingMachines,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Error filtering data" },
      { status: 500 },
    );
  }
}
