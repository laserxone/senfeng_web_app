import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT account, balance FROM office_fund_balances WHERE office = $1",
      ["karachi"],
    );
    const balances = { cash: "0.00", bank: "0.00" };
    for (const row of result.rows) {
      if (row.account === "cash") balances.cash = String(row.balance);
      if (row.account === "bank") balances.bank = String(row.balance);
    }
    return NextResponse.json(balances, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error fetching Karachi office balances:", error);
    return NextResponse.json(
      { message: "Failed to fetch office balances" },
      { status: 500 },
    );
  }
}
