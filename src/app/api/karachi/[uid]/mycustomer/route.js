import {karachi_pool as pool} from "@/config/db"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
import { NextResponse } from "next/server"



export async function GET(req, { params }) {
    const { uid } = await params;

    try {
        if (!uid) {
            return NextResponse.json({ message: 'Id missing' }, { status: 400 });
        }

        const isAdmin = await checkSuperadmin(uid);

        // Base query with join to get ownership_name
        let query = `
            SELECT 
                c.id, 
                c.name, 
                c.owner, 
                c.location, 
                c.number, 
                c.lead, 
                c.ownership,
                u.name AS ownership_name
            FROM customer c
            LEFT JOIN users u ON c.ownership = u.id
        `;
        const queryParams = [];

        if (!isAdmin) {
            const userQuery = await pool.query(
                `SELECT id, limited_access, designation FROM users WHERE id = $1`,
                [uid]
            );

            const user = userQuery.rows[0];
            if (!user) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }

            if (user.limited_access) {
                if (user.designation === 'Sales') {
                    query += ` WHERE c.ownership = $1`;
                    queryParams.push(uid);
                } else if (
                    user.designation === 'Social Media Manager' ||
                    user.designation === 'Customer Relationship Manager'
                ) {
                    query += ` WHERE c.lead = $1`;
                    queryParams.push(uid);
                }
            }
            if(user.designation === 'Dealer') {
                query += ` WHERE c.ownership = $1`;
                queryParams.push(uid);
            }
        }

        const result = await pool.query(query, queryParams);
        return NextResponse.json(result.rows, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
}


export const revalidate = 0

