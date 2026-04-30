import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req:NextRequest) {

   const office = "karachi"

    try {
        const result = await pool.query(`SELECT id, machine_model, machine_source, machine_power, booked FROM order_items WHERE booked IS FALSE AND show IS TRUE AND LOWER(location) = $1`, [office])
        return NextResponse.json(result.rows, { status: 200 })
    } catch (error:any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }

}

export const revalidate = 0