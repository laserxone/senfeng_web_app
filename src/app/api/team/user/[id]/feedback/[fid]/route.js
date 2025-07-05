import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function DELETE(req, { params }) {

    const { fid } = await params
    if (!fid) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        await pool.query(`DELETE FROM feedback WHERE id = $1`, [fid])
        return NextResponse.json({ message: "Feedback delete" }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
    }

}

export const revalidate = 0