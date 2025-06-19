import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function GET(req) {

    try {
        const result = await pool.query(`SELECT id, machine_model, machine_source, machine_power, booked FROM order_items WHERE booked IS FALSE`)
        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }

}

export const revalidate = 0