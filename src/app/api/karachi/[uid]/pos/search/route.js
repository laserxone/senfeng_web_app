import pool from '@/config/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
 

  try {

   
       const query = `
      SELECT * FROM savedinvoices_karachi`
      const result = await pool.query(query);
      return NextResponse.json(result.rows, { status: 200 });
    


  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export const revalidate = 0;
