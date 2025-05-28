import {karachi_pool as pool} from "@/config/db";
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    const { id } = await params;
    const { payment } = await req.json();

    try {
       
        await pool.query(
            `UPDATE savedinvoices SET 
                payment = $1
             WHERE id = $2`,
            [
                payment,
                id
            ]
        );

        return NextResponse.json({ message: "Invoice updated successfully" }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Processing error" }, { status: 500 });
    }
}

export const revalidate = 0;
