import pool from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, {params}) {

    const {id} = await params


    try {
        const result = await pool.query(`SELECT * FROM feedback WHERE customer_id = $1`, [id])
        return NextResponse.json(result.rows, { status: 200 })

    } catch (error) {
        console.error('Error ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export async function POST(req, { params }) {
    const { id, uid } = await params
    const { next_followup, feedback, top_follow, type } = await req.json()

   

    try {
        const query = `
        INSERT INTO feedback(
            user_id, customer_id, feedback, next_followup, top_follow, type
        )
        VALUES (
            $1, $2, $3, $4, $5, $6
        )
    `;

        const values = [
            uid,
            id,
            feedback,
            next_followup,
            top_follow,
            type
        ];

        await pool.query(query, values);
        return NextResponse.json({ message: 'done' }, { status: 200 })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: 'Error' }, { status: 500 })
    }


}

export const revalidate = 0