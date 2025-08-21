import pool from "@/config/db"

export async function PUT(req, { params }) {
    const body = await req.json()
    await pool.query("UPDATE todos SET is_done=$1, updated_at=NOW() WHERE id=$2", [body.is_done, params.id])
    return Response.json({ success: true })
}
