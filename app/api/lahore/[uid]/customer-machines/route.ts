import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest) {

    const searchParams = req.nextUrl.searchParams
    const customer_id = searchParams.get("customer_id") ?? null

    try {
        if (!customer_id) {
            return NextResponse.json({ message: "Customer id is missing" }, { status: 400 })
        }
        const result = await pool.query(`SELECT id, order_no_arr, serial_no, power, source, type, parts_information
            FROM sale
            WHERE customer_id = $1`, [customer_id])
        return NextResponse.json(result.rows, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }

}

export const revalidate = 0