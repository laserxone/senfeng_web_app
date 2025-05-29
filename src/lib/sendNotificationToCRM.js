import pool from "@/config/db"
import { sendNotification } from "./sendNotification"


export async function sendNotificationToCRM(id, customer, page) {
  if (!id) return;

  const leadResult = await pool.query('SELECT id, designation FROM users WHERE id = $1', [id]);
  const leadUser = leadResult.rows[0];

  if (!leadUser || leadUser.designation !== 'Social Media Manager') return;

  const crmQuery = await pool.query(
    `SELECT id FROM users WHERE designation = 'Customer Relationship Manager'`
  );

  if (crmQuery.rows.length === 0) return;

   crmQuery.rows.forEach((crm) => {
      sendNotification(`${customer} added by social media manager`, page, crm.id);
    });
}
