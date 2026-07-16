import { NextRequest, NextResponse } from "next/server";
import pool from "@/config/db"
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NOTIFICATION_TYPES } from "@/constants/notifications";

export async function GET(){

    try {
        const res = await pool.query(`
               SELECT 
            q.*,
            u.name AS user_name
        FROM quotation q
        LEFT JOIN users u ON q.user_id = u.id
        ORDER BY q.created_at DESC`)
        return NextResponse.json(res?.rows)
    } catch (error : any) {
        return NextResponse.json({message : error?.message || "Server error"}, {status: 500})
    }
}

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
        INSERT INTO quotation (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

     const res =    await pool?.query(query, values);
 sendNotificationToOwner(`${res.rows?.[0]?.customer_name || res?.rows?.[0]?.contact_person}`,`quotation?q=${res?.rows?.[0]?.id}`, "karachi", "sales", NOTIFICATION_TYPES.quotation_submitted.title)

        
        return NextResponse.json({ message: "Inserted successfully", id : res?.rows?.[0]?.id ?? null }, { status: 201 });

    } catch (error: any) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error?.message || "Server Error" }, { status: 500 })
    }
}