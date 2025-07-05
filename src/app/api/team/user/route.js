import pool from "@/config/db";
import { auth } from "@/config/firebase";
import admin from "@/lib/firebaseAdmin";
import { sendPasswordResetEmail } from "firebase/auth";
import { NextResponse } from "next/server"





export async function POST(req) {

  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
    }

    const { email } = data;

    const checkEmail = await pool.query(`SELECT id FROM users WHERE email = $1`, [email])
    if (checkEmail.rows.length != 0) {
      return NextResponse.json({ message: "Email already exists in the system" }, { status: 400 })
    }

    const password = "1234qwer!@#";

    try {
      await admin.auth().createUser({
        email,
        password,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.warn(`Email ${email} already exists in Firebase, continuing...`);
      } else {
        throw error;
      }
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    const newUser = rows[0];

    sendPasswordResetEmail(auth, email, {
      url: "https://senfeng-web.vercel.app/login"
    })

    return NextResponse.json(newUser, { status: 200 });

  } catch (error) {
    console.error('Error inserting data: ', error);
    return NextResponse.json({ message: error?.message || 'Error adding user' }, { status: 500 });
  }
}

export async function GET(req) {

  const searchParams = req.nextUrl.searchParams
  const user = searchParams.get('user')
  const withoutleave = searchParams.get('withoutleave')


  try {
    let query = `SELECT * FROM users`;
    let queryParams = [];
    let conditions = [];

    if (user) {
      conditions.push(`id = $${queryParams.length + 1}`);
      queryParams.push(user);
    }

    if (withoutleave) {
      conditions.push(`(leaving_date IS NULL OR leaving_date > now())`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY name ASC;`;

    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 });


  } catch (error) {
    console.error('Error inserting data: ', error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }

}


export const revalidate = 0