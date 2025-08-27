import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { uid } = await params


    try {
        const result = await pool.query(`SELECT * from issueditems WHERE user_id = $1 AND received IS FALSE`, [uid])

        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: "Something went wrong" }, { status: 200 })
    }

}