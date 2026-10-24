import pool from "@/config/db";
import { NextResponse } from "next/server";

async function getKhata(office: "lahore" | "karachi") {
  const result = await pool.query(
    `
    SELECT 
      k.*,
      COALESCE(SUM(kp.amount), 0) AS total_amount
    FROM khata k
    LEFT JOIN khata_payments kp
      ON kp.khata_id = k.id
    WHERE k.office = $1
    GROUP BY k.id
    ORDER BY k.created_at DESC
  `,
    [office],
  );

  return NextResponse.json(result.rows);
}

async function postKhata(req: Request, office: "lahore" | "karachi") {
  const body = await req.json();

  const { name, start_date, end_date, note } = body;

  const result = await pool.query(
    `
    INSERT INTO khata (name, start_date, end_date, note, office)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [name, start_date, end_date, note, office],
  );

  return NextResponse.json(result.rows[0]);
}

export const createKhataHandlers = (office: "lahore" | "karachi") => ({
  GET: () => getKhata(office),
  POST: (req: Request) => postKhata(req, office),
});

export const { GET, POST } = createKhataHandlers("lahore");
