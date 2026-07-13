

import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req:NextRequest) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO ambiguous_logs (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const { rows } = await pool.query(query, values);

        return NextResponse.json(
            rows
            , { status: 200 });

    } catch (error:any) {
        return NextResponse.json({ message: error.message || 'Error saving data' }, { status: 500 })
    }
}
