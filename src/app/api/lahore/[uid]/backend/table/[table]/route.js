import { NextResponse } from "next/server";
import pool from "@/config/db";

async function tableExists(table) {
  const q = `
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = $1
    LIMIT 1
  `;
  const r = await pool.query(q, [table]);
  return r.rowCount > 0;
}

export async function GET(req, { params }) {
  const { table } = await params;

  try {
    if (!table) return NextResponse.json({ error: "missing table" }, { status: 400 });

    const exists = await tableExists(table);
    if (!exists) return NextResponse.json({ error: "table not found" }, { status: 404 });

    // get columns + types
    const colQ = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name = $1
      ORDER BY ordinal_position
    `;
    const colRes = await pool.query(colQ, [table]);
    const columns = colRes.rows.map((r) => ({ name: r.column_name, type: r.data_type }));

    // fetch rows (limit for safety; adjust as needed)
    const rowsRes = await pool.query(`SELECT * FROM ${table} LIMIT 2000`); // table name validated above
    return NextResponse.json({ columns, rows: rowsRes.rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}