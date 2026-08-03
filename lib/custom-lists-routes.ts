import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"

type Office = "lahore" | "karachi"
type Context = {
  params: Promise<{
    uid: string
    id?: string
    columnId?: string
    rowId?: string
  }>
}
const jsonError = (message: string, status = 400) =>
  NextResponse.json({ message }, { status })
const numberId = (id?: string) => Number.parseInt(id || "", 10)
const listExists = async (id: number, office: Office) =>
  (
    await pool.query(
      "SELECT id FROM custom_lists WHERE id = $1 AND office = $2",
      [id, office]
    )
  ).rowCount === 1

export function listRoutes(office: Office) {
  return {
    async GET() {
      try {
        const result = await pool.query(
          `SELECT l.*, COUNT(r.id)::int AS record_count FROM custom_lists l LEFT JOIN custom_list_rows r ON r.list_id = l.id WHERE l.office = $1 GROUP BY l.id ORDER BY l.is_pinned DESC, l.updated_at DESC`,
          [office]
        )
        return NextResponse.json(result.rows)
      } catch {
        return jsonError("Failed to fetch lists", 500)
      }
    },
    async POST(request: NextRequest, { params }: Context) {
      const client = await pool.connect()
      try {
        const { uid } = await params
        const body = await request.json()
        const title = String(body.title || "").trim()
        const columns = Array.isArray(body.columns)
          ? body.columns.map((name: any) => String(name).trim()).filter(Boolean)
          : []
        if (!title || !columns.length)
          return jsonError("A title and at least one column are required")
        if (
          new Set(columns.map((name: any) => name.toLowerCase())).size !==
          columns.length
        )
          return jsonError("Column names must be unique")
        await client.query("BEGIN")
        const list = (
          await client.query(
            "INSERT INTO custom_lists (owner_id, office, title, description) VALUES ($1, $2, $3, $4) RETURNING *",
            [uid, office, title, String(body.description || "").trim() || null]
          )
        ).rows[0]
        for (const [index, name] of columns.entries())
          await client.query(
            "INSERT INTO custom_list_columns (list_id, name, position) VALUES ($1, $2, $3)",
            [list.id, name, index + 1]
          )
        await client.query("COMMIT")
        return NextResponse.json(list, { status: 201 })
      } catch (cause) {
        await client.query("ROLLBACK")
        console.error(cause)
        return jsonError("Failed to create list", 500)
      } finally {
        client.release()
      }
    },
  }
}

export function listDetailRoutes(office: Office) {
  return {
    async GET(_: NextRequest, { params }: Context) {
      try {
        const { id } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const [list, columns, rows, cells] = await Promise.all([
          pool.query("SELECT * FROM custom_lists WHERE id = $1", [listId]),
          pool.query(
            "SELECT * FROM custom_list_columns WHERE list_id = $1 ORDER BY position",
            [listId]
          ),
          pool.query(
            "SELECT * FROM custom_list_rows WHERE list_id = $1 ORDER BY position",
            [listId]
          ),
          pool.query(
            "SELECT c.* FROM custom_list_cells c INNER JOIN custom_list_rows r ON r.id = c.row_id WHERE r.list_id = $1",
            [listId]
          ),
        ])
        return NextResponse.json({
          ...list.rows[0],
          columns: columns.rows,
          rows: rows.rows,
          cells: cells.rows,
        })
      } catch {
        return jsonError("Failed to fetch list", 500)
      }
    },
    async PUT(request: NextRequest, { params }: Context) {
      try {
        const { id } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const body = await request.json()
        const title =
          body.title === undefined ? null : String(body.title).trim()
        if (title === "") return jsonError("Title cannot be empty")
        const result = await pool.query(
          "UPDATE custom_lists SET title = COALESCE($1, title), description = COALESCE($2, description), is_pinned = COALESCE($3, is_pinned), updated_at = NOW() WHERE id = $4 AND office = $5 RETURNING *",
          [
            title,
            body.description === undefined
              ? null
              : String(body.description).trim(),
            typeof body.is_pinned === "boolean" ? body.is_pinned : null,
            listId,
            office,
          ]
        )
        return NextResponse.json(result.rows[0])
      } catch {
        return jsonError("Failed to update list", 500)
      }
    },
    async DELETE(_: NextRequest, { params }: Context) {
      try {
        const { id } = await params
        const result = await pool.query(
          "DELETE FROM custom_lists WHERE id = $1 AND office = $2 RETURNING id",
          [numberId(id), office]
        )
        return result.rowCount
          ? NextResponse.json({ message: "List deleted" })
          : jsonError("List not found", 404)
      } catch {
        return jsonError("Failed to delete list", 500)
      }
    },
  }
}

export function columnRoutes(office: Office) {
  return {
    async POST(request: NextRequest, { params }: Context) {
      try {
        const { id } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const body = await request.json()
        const name = String(body.name || "").trim()
        if (!name) return jsonError("Column name is required")
        const result = await pool.query(
          "INSERT INTO custom_list_columns (list_id, name, position, column_type) VALUES ($1, $2, COALESCE((SELECT MAX(position) + 1 FROM custom_list_columns WHERE list_id = $1), 1), $3) RETURNING *",
          [listId, name, body.column_type || "text"]
        )
        await pool.query(
          "UPDATE custom_lists SET updated_at = NOW() WHERE id = $1",
          [listId]
        )
        return NextResponse.json(result.rows[0], { status: 201 })
      } catch {
        return jsonError("Failed to add column", 500)
      }
    },
  }
}
export function columnDetailRoutes(office: Office) {
  return {
    async PUT(request: NextRequest, { params }: Context) {
      try {
        const { id, columnId } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const name = String((await request.json()).name || "").trim()
        if (!name) return jsonError("Column name is required")
        const result = await pool.query(
          "UPDATE custom_list_columns SET name = $1 WHERE id = $2 AND list_id = $3 RETURNING *",
          [name, numberId(columnId), listId]
        )
        return result.rowCount
          ? NextResponse.json(result.rows[0])
          : jsonError("Column not found", 404)
      } catch {
        return jsonError("Failed to update column", 500)
      }
    },
    async DELETE(_: NextRequest, { params }: Context) {
      try {
        const { id, columnId } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const result = await pool.query(
          "DELETE FROM custom_list_columns WHERE id = $1 AND list_id = $2 RETURNING id",
          [numberId(columnId), listId]
        )
        return result.rowCount
          ? NextResponse.json({ message: "Column deleted" })
          : jsonError("Column not found", 404)
      } catch {
        return jsonError("Failed to delete column", 500)
      }
    },
  }
}

export function rowRoutes(office: Office) {
  return {
    async POST(request: NextRequest, { params }: Context) {
      const client = await pool.connect()
      try {
        const { id } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const values = (await request.json()).values || {}
        await client.query("BEGIN")
        const row = (
          await client.query(
            "INSERT INTO custom_list_rows (list_id, position) VALUES ($1, COALESCE((SELECT MAX(position) + 1 FROM custom_list_rows WHERE list_id = $1), 1)) RETURNING *",
            [listId]
          )
        ).rows[0]
        for (const [columnId, value] of Object.entries(values))
          await client.query(
            "INSERT INTO custom_list_cells (row_id, column_id, value) SELECT $1, id, $3 FROM custom_list_columns WHERE id = $2 AND list_id = $4",
            [
              row.id,
              numberId(columnId),
              value == null ? null : String(value),
              listId,
            ]
          )
        await client.query(
          "UPDATE custom_lists SET updated_at = NOW() WHERE id = $1",
          [listId]
        )
        await client.query("COMMIT")
        return NextResponse.json(row, { status: 201 })
      } catch (cause) {
        await client.query("ROLLBACK")
        console.error(cause)
        return jsonError("Failed to add entry", 500)
      } finally {
        client.release()
      }
    },
  }
}
export function rowDetailRoutes(office: Office) {
  return {
    async PUT(request: NextRequest, { params }: Context) {
      const client = await pool.connect()
      try {
        const { id, rowId } = await params
        const listId = numberId(id),
          numericRowId = numberId(rowId)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const values = (await request.json()).values || {}
        await client.query("BEGIN")
        for (const [columnId, value] of Object.entries(values))
          await client.query(
            "INSERT INTO custom_list_cells (row_id, column_id, value, updated_at) SELECT $1, id, $3, NOW() FROM custom_list_columns WHERE id = $2 AND list_id = $4 ON CONFLICT (row_id, column_id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
            [
              numericRowId,
              numberId(columnId),
              value == null ? null : String(value),
              listId,
            ]
          )
        await client.query(
          "UPDATE custom_list_rows SET updated_at = NOW() WHERE id = $1 AND list_id = $2",
          [numericRowId, listId]
        )
        await client.query(
          "UPDATE custom_lists SET updated_at = NOW() WHERE id = $1",
          [listId]
        )
        await client.query("COMMIT")
        return NextResponse.json({ message: "Entry updated" })
      } catch (cause) {
        await client.query("ROLLBACK")
        console.error(cause)
        return jsonError("Failed to update entry", 500)
      } finally {
        client.release()
      }
    },
    async DELETE(_: NextRequest, { params }: Context) {
      try {
        const { id, rowId } = await params
        const listId = numberId(id)
        if (!listId || !(await listExists(listId, office)))
          return jsonError("List not found", 404)
        const result = await pool.query(
          "DELETE FROM custom_list_rows WHERE id = $1 AND list_id = $2 RETURNING id",
          [numberId(rowId), listId]
        )
        return result.rowCount
          ? NextResponse.json({ message: "Entry deleted" })
          : jsonError("Entry not found", 404)
      } catch {
        return jsonError("Failed to delete entry", 500)
      }
    },
  }
}
