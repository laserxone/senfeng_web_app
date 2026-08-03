import { NextRequest, NextResponse } from "next/server"
import pool from "@/config/db"

import { parse } from "url"

async function tableExists(table: any) {
  const q = `
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = $1
    LIMIT 1
  `
  const r = await pool.query(q, [table])
  return r.rows.length > 0
}

async function getColumnsForTable(table: any) {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name = $1
  `
  const r = await pool.query(q, [table])
  return r.rows.map((r) => r.column_name)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ table: any }> }
) {
  const { table } = await params

  try {
    if (!table)
      return NextResponse.json({ error: "missing table" }, { status: 400 })

    const exists = await tableExists(table)
    if (!exists)
      return NextResponse.json({ error: "table not found" }, { status: 404 })

    const body = await req.json()
    const changes = body?.changes
    if (!changes || typeof changes !== "object") {
      return NextResponse.json(
        { error: "invalid changes payload" },
        { status: 400 }
      )
    }

    // allowed columns for this table
    const allowedCols = await getColumnsForTable(table)
    // ensure 'id' exists — we assume id PK. If no id, you'd need PK detection.
    if (!allowedCols.includes("id")) {
      return NextResponse.json(
        {
          error:
            "table does not have 'id' column; save-handler expects 'id' PK",
        },
        { status: 400 }
      )
    }

    // Apply updates in a transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const updatedRows = []

      for (const [rowId, rowChanges] of Object.entries(changes)) {
        if (!rowChanges || typeof rowChanges !== "object") continue

        // Build SET clause with parameterized values
        const keys = Object.keys(rowChanges).filter(
          (k) => allowedCols.includes(k) && k !== "id"
        ) // don't allow changing id
        if (keys.length === 0) continue

        const setClauses: any[] = []
        const values = []
        let idx = 1

        for (const c of keys) {
          setClauses.push(`"${c}" = $${idx}`)
          values.push(rowChanges[c])
          idx++
        }

        // where id = $idx
        values.push(rowId)
        const sql = `UPDATE "${table}" SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *;`

        const res = await client.query(sql, values)
        if (res.rows.length) updatedRows.push(res.rows[0])
      }

      await client.query("COMMIT")

      return NextResponse.json({ success: true, updated: updatedRows })
    } catch (txErr) {
      await client.query("ROLLBACK")
      console.error("transaction failed", txErr)
      return NextResponse.json({ error: String(txErr) }, { status: 500 })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error("save handler error", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
