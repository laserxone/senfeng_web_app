import { karachi_pool as pool } from "@/config/db";
import { sendNotification } from "./sendNotification";


export async function sendNotificationToSMMKarachi(id, customer, page, saleperson) {
  if (!id || !saleperson) return;

  const leadResult = await pool.query('SELECT id, designation FROM users WHERE id = $1', [id]);
  const leadUser = leadResult.rows[0];

  if (!leadUser || leadUser.designation !== 'Social Media Manager') return;

  const salePersonQuery = await pool.query("SELECT name, email FROM users WHERE id = $1", [saleperson])
  const salePersonResult = salePersonQuery.rows[0]

  if (salePersonResult) {
    sendNotification(`${customer} assigned to ${salePersonQuery.rows[0].name || salePersonQuery.rows[0].email}`, page, id);
  }


}

