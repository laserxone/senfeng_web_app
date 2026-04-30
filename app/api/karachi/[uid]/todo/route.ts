import pool from "@/config/db"
import { NextRequest } from "next/server"

export async function GET(req:NextRequest, { params }:{params:Promise<{uid:string}>}) {
  const { uid } = await params
  const todos = await pool.query("SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC", [uid])
  return Response.json(todos.rows)
}

export async function POST(req:NextRequest, { params }:{params:Promise<{uid:string}>}) {
  const body = await req.json()
  const { uid } = await params
  const result = await pool.query("INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING *", [uid, body.title])
  return Response.json(result.rows[0], { status: 200 })
}
