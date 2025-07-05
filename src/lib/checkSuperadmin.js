import pool from "@/config/db"
import { NextResponse } from "next/server"


export async function checkSuperadmin(id) {

    if (!id) throw new Error("User ID is missing");

    const userQuery = await pool.query(
        `SELECT id, designation, full_access FROM users WHERE id = $1`,
        [id]
    );

    const user = userQuery.rows[0];
    if (!user) throw new Error("User not found");

    return user.designation === "Owner" || user.full_access === true;
}