import { karachi_pool as pool } from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

  const { uid } = await params

  try {
    const isAdmin = await checkSuperadmin(uid)

    if (isAdmin) {
      const result = await pool.query(`
         SELECT 
  mi.*, 
  s.serial_no, 
  s.sell_by, 
  s.customer_id,
  c.name AS customer_name, 
  c.owner AS customer_owner, 
  u.name AS seller_name,
  -- custom flags
  CONCAT('Cheque of ', mi.amount, ' against ', s.serial_no, ' from customer ', c.name, ' ', c.owner) AS title,
  CONCAT('/member/', s.customer_id, '/', s.id) AS link
FROM machine_installments mi
JOIN sale s ON mi.sale_id = s.id
JOIN customer c ON s.customer_id = c.id
JOIN users u ON s.sell_by = u.id
WHERE 
  mi.pending = true
  AND (
    mi.date < NOW() 
    OR (mi.date >= NOW() AND mi.date <= NOW() + INTERVAL '3 days')
  )
ORDER BY mi.date ASC;
`)

      return NextResponse.json(result.rows, { status: 200 })
    } else {
      const result = await pool.query(`
    SELECT 
      mi.*, 
      s.serial_no, 
      s.sell_by, 
      s.customer_id,
      c.name AS customer_name, 
      c.owner AS customer_owner, 
      u.name AS seller_name,
      -- custom flags
      CONCAT('Cheque of ', mi.amount, ' against ', s.serial_no, ' from customer ', c.name, ' ', c.owner) AS title,
      CONCAT('/member/', s.customer_id, '/', s.id) AS link
    FROM machine_installments mi
    JOIN sale s ON mi.sale_id = s.id
    JOIN customer c ON s.customer_id = c.id
    JOIN users u ON s.sell_by = u.id
    WHERE 
      mi.pending = true
      AND (
        mi.date < NOW() 
        OR (mi.date >= NOW() AND mi.date <= NOW() + INTERVAL '3 days')
      )
      AND c.ownership = $1
    ORDER BY mi.date ASC;
  `, [uid])

      return NextResponse.json(result.rows, { status: 200 })
    }
  } catch (error) {
    return NextResponse.json({ message: "Error occured" }, { status: 500 })
  }

}

export const revalidate = 0