
import pool from '@/config/db';
import { NextResponse } from 'next/server';



export async function PUT(req, {params}) {
    try {
        const data = await req.json();
        const {...updates } = data;
        const {id} = await params
        
        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }
  
        const fields = [];
        const values = [];
  
        Object.entries(updates).forEach(([key, value], index) => {
            if (value !== undefined) {
                fields.push(`${key} = $${index + 1}`);
                values.push(value);
            }
        });
  
        if (fields.length === 0) {
            return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
        }
  
        values.push(id);
        const query = `
            UPDATE inventory 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;
  
        await pool.query(query, values);
  
        console.log("data updated successfully");
        return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  }

export const revalidate = 0