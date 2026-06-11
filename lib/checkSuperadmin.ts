import pool from "@/config/db";


export async function checkSuperadmin(id: string, reimbursement: boolean = false) {

    if (!id) throw new Error("User ID is missing");

    const userQuery = await pool.query(
        `SELECT id, designation, reimbursement_approval, full_access FROM users WHERE id = $1`,
        [id]
    );


    let user = userQuery.rows[0];

    if (!user) throw new Error("User not found");

    if (reimbursement) return user.designation === "Owner" || user.full_access === true || user.reimbursement_approval

    return user.designation === "Owner" || user.full_access === true;
}

export async function getDesignation(id: string) {

    if (!id) throw new Error("User ID is missing");

    const userQuery = await pool.query(
        `SELECT id, designation FROM users WHERE id = $1`,
        [id]
    );


    let user = userQuery.rows[0];

    if (!user) throw new Error("User not found");

    return user.designation
}