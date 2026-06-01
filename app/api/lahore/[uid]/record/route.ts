

import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {

    const { uid } = await params

    let salaryRows
    let salaries

    try {

        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {
            salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            WHERE issued = $1 AND u.office = 'lahore'
            ORDER BY s.year DESC, s.month DESC;
        `, [true]);

        } else {
            salaries = await pool.query(`
            SELECT 
                s.*, 
                u.name AS user_name 
            FROM salaries s
            INNER JOIN users u ON s.user_id = u.id
            WHERE s.issued = $1 AND s.user_id = $2
            ORDER BY s.year DESC, s.month DESC;
        `, [true, uid]);
        }

        salaryRows = salaries.rows;

        const commissionIds = [
            ...new Set(
                salaryRows.flatMap(row =>
                    Array.isArray(row.issued_commissions)
                        ? row.issued_commissions
                        : []
                )
            )
        ];

        if (commissionIds.length) {
            const commissionsResult = await pool.query(`
        SELECT
            c.id,
            c.sale_id,
            c.commission_amount,
             s.serial_no,
        s.power,
        s.source,
        s.contract_date,
        array_to_string(s.order_no_arr, ', ') AS order_numbers,
            cu.name AS customer_name,
            cu.owner AS customer_owner
        FROM commissions c
        LEFT JOIN sale s
            ON c.sale_id = s.id
        LEFT JOIN customer cu
            ON s.customer_id = cu.id
        WHERE c.id = ANY($1)
    `, [commissionIds]);

            const commissionsMap = new Map(
                commissionsResult.rows.map(row => [row.id, row])
            );

            salaryRows.forEach(salary => {
                salary.issued_commissions_detail = (
                    salary.issued_commissions || []
                )
                    .map((id : any) => commissionsMap.get(id))
                    .filter(Boolean);
            });
        }


        return NextResponse.json(salaries.rows, { status: 200 });
    } catch (error: any) {

        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}



export const revalidate = 0