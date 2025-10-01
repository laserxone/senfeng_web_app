

import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextResponse } from "next/server"

export async function GET(req, { params }) {

    const { uid } = await params

    try {

        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {
            const officeQuery = await pool.query(`SELECT office FROM users WHERE id = $1`, [uid])
            const office = officeQuery.rows[0]?.office
            const salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            WHERE issued = $1 AND u.office = $2
            ORDER BY s.year DESC, s.month DESC;
        `, [true, office]);

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
    } catch (error) {

        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}



export const revalidate = 0