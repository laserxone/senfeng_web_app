import pool from "@/config/db"
import admin from "@/lib/firebaseAdmin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const result = await pool.query(
      `
  SELECT 
  c.*,
  cu.name AS customer_name,
  cu.owner AS customer_owner,
  cu.location AS customer_location,
  cu.address AS customer_address,
  cu.pin AS customer_pin,
  cu.number AS customer_number,
  ou.name AS ownership_name,

  ca.id AS assignment_id,
  ca.engineer_id,
  eu.name AS engineer_name,
  ca.assigned_by,
  au.name AS assigned_by_name,
  ca.created_at AS assignment_created_at,

  COALESCE(
    (
      SELECT json_agg(cl)
      FROM (
        SELECT remark, location, created_at
        FROM complaint_logs
        WHERE complaint_id = c.id
        ORDER BY created_at DESC
      ) cl
    ),
    '[]'
  ) AS logs

FROM complaints c
LEFT JOIN customer cu ON c.customer_id = cu.id
LEFT JOIN users ou ON cu.ownership = ou.id
LEFT JOIN complaint_assignments ca ON c.id = ca.complaint_id
LEFT JOIN users eu ON ca.engineer_id = eu.id
LEFT JOIN users au ON ca.assigned_by = au.id

WHERE c.id = $1;

`,
      [id]
    )

    return NextResponse.json(result.rows[0] || {}, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect()

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { message: "Complaint ID is required." },
        { status: 400 }
      )
    }

    const bucket = admin.storage().bucket()

    await client.query("BEGIN")

    // 1. GET LOG FILES (signature + image)
    const logsRes = await client.query(
      `SELECT signature, image FROM complaint_logs WHERE complaint_id = $1`,
      [id]
    )

    // delete log files from firebase
    for (const log of logsRes.rows) {
      if (log.signature) {
        try {
          await bucket.file(log.signature).delete()
        } catch (err) {
          console.error("Signature delete error:", err)
        }
      }

      if (log.image) {
        try {
          await bucket.file(log.image).delete()
        } catch (err) {
          console.error("Image delete error:", err)
        }
      }
    }

    // 2. DELETE LOGS
    await client.query(`DELETE FROM complaint_logs WHERE complaint_id = $1`, [
      id,
    ])

    // 3. GET PAYMENT FILES (slip)
    const paymentsRes = await client.query(
      `SELECT slip FROM complaint_payments WHERE complaint_id = $1`,
      [id]
    )

    for (const payment of paymentsRes.rows) {
      if (payment.slip) {
        try {
          await bucket.file(payment.slip).delete()
        } catch (err) {
          console.error("Slip delete error:", err)
        }
      }
    }

    // 4. DELETE PAYMENTS
    await client.query(
      `DELETE FROM complaint_payments WHERE complaint_id = $1`,
      [id]
    )

    // 5. DELETE ASSIGNMENTS
    await client.query(
      `DELETE FROM complaint_assignments WHERE complaint_id = $1`,
      [id]
    )

    // 6. DELETE COMPLAINT
    await client.query(`DELETE FROM complaints WHERE id = $1`, [id])

    await client.query("COMMIT")

    return NextResponse.json({
      message: "Complaint and all related data deleted successfully.",
    })
  } catch (error) {
    await client.query("ROLLBACK")

    console.error("Delete complaint error:", error)

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export const revalidate = 0
