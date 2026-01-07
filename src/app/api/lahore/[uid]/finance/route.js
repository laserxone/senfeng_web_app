import pool from "@/config/db";
import { NextResponse } from "next/server";


export async function GET(req){

     const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  const office = "lahore";

  try {
  const query = `
  SELECT
    s.id AS machine_id,
    s.serial_no AS machine_serial_no,
    s.price AS machine_price,
    s.power AS machine_power,

    u.name AS sell_by_name,

    c.name AS customer_name,
    c.owner AS customer_owner,

    -- payments list
    COALESCE(
      json_agg(
        json_build_object(
          'id', p.id,
          'amount', p.amount,
          'payment_date', p.transaction_date,
          'method', p.mode
        )
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'
    ) AS payments,

    -- totals
    s.price AS total_generated,
    COALESCE(SUM(p.amount), 0) AS total_payment_received,
    s.price - COALESCE(SUM(p.amount), 0) AS total_balance

  FROM sale s
  LEFT JOIN users u ON u.id = s.sell_by
  LEFT JOIN customer c ON c.id = s.customer_id
  LEFT JOIN payment p ON p.machine_id = s.id

  WHERE s.contract_date BETWEEN $1 AND $2
    AND u.office = $3

  GROUP BY
    s.id,
    s.serial_no,
    s.price,
    s.power,
    u.name,
    c.name,
    c.owner

  ORDER BY s.contract_date DESC
`;



    const { rows } = await pool.query(query, [
      start_date,
      end_date,
      office,
    ]);

    return NextResponse.json(rows, {status : 200})
  } catch (error) {
      return NextResponse.json({message : error?.message || "Error filtering data"}, {status : 500})
  }


 


}