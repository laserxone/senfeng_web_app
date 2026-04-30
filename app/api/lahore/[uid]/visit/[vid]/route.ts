import pool from "@/config/db"
import { NextRequest, NextResponse } from "next/server"


export async function DELETE(req:NextRequest, { params }:{params:Promise<{vid:string}>}) {

    const { vid } = await params
    if (!vid) {
        return NextResponse.json({ message: "Id is missing" }, { status: 400 })
    }

    try {
        await pool.query(`DELETE FROM visit WHERE id = $1`, [vid])
        return NextResponse.json({ message: "Feedback delete" }, { status: 200 })
    } catch (error:any) {
        return NextResponse.json({ message:error.message || "Internal server error" }, { status: 500 })
    }

}

export const revalidate = 0