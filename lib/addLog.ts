import pool from "@/config/db";

export async function addLog({ text, user_id = null, customer_id = null, payment_id = null, sale_id = null }: { text: string, user_id: string | null, customer_id: string | null, payment_id: string | null, sale_id: string | null }) {
    try {
        const query = `
      INSERT INTO logs (text, user_id, customer_id, payment_id, sale_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [text, user_id, customer_id, payment_id, sale_id];

        pool.query(query, values);

    } catch (error) {
        console.log("Error inserting log:", error);
    }
}