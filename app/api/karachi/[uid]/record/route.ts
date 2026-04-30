

import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextRequest, NextResponse } from "next/server"

export async function GET(req:NextRequest, { params }:{params:Promise<{uid:string}>}) {

    const { uid } = await params

    try {

        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {
            const salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            WHERE issued IS TRUE AND u.office = 'karachi'
            ORDER BY s.year DESC, s.month DESC;
        `);

            return NextResponse.json(salaries.rows, { status: 200 });

        } else {
            const salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            WHERE s.issued = $1 AND s.user_id = $2
            ORDER BY s.year DESC, s.month DESC;
        `, [true, uid]);

            return NextResponse.json(salaries.rows, { status: 200 });

        }
    } catch (error:any) {

        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}



export const revalidate = 0