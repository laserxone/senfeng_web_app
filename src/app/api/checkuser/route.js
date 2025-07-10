import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const searchParams = req.nextUrl.searchParams
        const uid = searchParams.get('uid')

        if (!uid) {
            return NextResponse.json({ message: "Invalid user" }, { status: 400 });
        }

        const result = await pool.query(
            `SELECT id, active FROM users WHERE id = $1`,
            [uid]
        );

        const user = result.rows[0];

        if (!user || !user.active) {
            return NextResponse.json(
                { message: "User is inactive or does not exist" },
                { status: 403 }
            );
        }

        return NextResponse.json({ active: true }, { status: 200 });
    } catch (err) {
        console.error("DB Error:", err);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
