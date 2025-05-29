import pool from "@/config/db";

export async function addLog({ text, user_id = null, customer_id = null, payment_id = null, sale_id = null }) {
    try {
        const query = `
      INSERT INTO log (text, user_id, customer_id, payment_id, sale_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [text, user_id, customer_id, payment_id, sale_id];

        pool.query(query, values);

    } catch (error) {
        console.log("Error inserting log:", error);
    }
}