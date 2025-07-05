import pool from "@/config/db"
import { NextResponse } from "next/server"



export async function GET(req, { params }) {

    const { id } = await params

    try {

        if (!id) {
            return NextResponse.json({ message: 'Id missing' }, { status: 400 })
        }

        const userQuery = await pool.query(`SELECT id, limited_access, designation FROM users WHERE id = $1`, [id])

        const user = userQuery.rows[0]

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        let query = `SELECT id, name, owner, location, number, lead, ownership FROM customer`
        const queryParams = []

        if (user.limited_access) {
            if (user.designation === 'Sales') {
                query += ` WHERE ownership = $1`
                queryParams.push(id)
            } else if (user.designation === 'Social Media Manager' || user.designation === 'Customer Relationship Manager') {
                query += ` WHERE lead = $1`
                queryParams.push(id)
            }
        }

        const result = await pool.query(query, queryParams)
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0

