import pool from "@/config/db"
import { storage } from "@/config/firebase"
import { partFields, saleFields } from "@/constants/data"
import { addLog } from "@/lib/addLog"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
import admin from "@/lib/firebaseAdmin"
import { generateLog } from "@/lib/generateLog"
import { deleteObject, ref } from "firebase/storage"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const { id, uid } = await params

  try {
    const isAdmin = await checkSuperadmin(uid)
    const userDetail = await pool.query(
      `SELECT id, designation, limited_access, customer_full_access FROM users WHERE id = $1`,
      [uid]
    )
    const user = userDetail.rows?.[0]

    if (isAdmin) {
      const machineQuery = `
  SELECT s.*, 
      co.commission_issued AS commission_issued,
         CASE WHEN cm.id IS NOT NULL THEN TRUE ELSE FALSE END AS cancelled_detail,
         cm.id AS cancelled_id,
         cm.created_at AS cancelled_at,
         cm.issued AS cancelled_issued,
         cm.reason AS cancelled_reason
  FROM sale s
  LEFT JOIN cancelled_machine cm ON s.id = cm.machine_id
  LEFT JOIN commissions co ON s.id = co.sale_id 
  WHERE s.id = $1
`

      const machineResult = await pool.query(machineQuery, [id])

      if (machineResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Machine not found" },
          { status: 404 }
        )
      }

      const machine = machineResult.rows[0]
      const customerId = machine.customer_id
      const sellBy = machine.sell_by

      const customerQuery = `
      SELECT 
    c.*,
    u.name AS ownership_name
FROM customer c
LEFT JOIN users u ON u.id = c.ownership
WHERE c.id = $1`
      const customerResult = await pool.query(customerQuery, [customerId])

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 }
        )
      }

      const customer = customerResult.rows[0]

      let sellByName = null
      if (sellBy) {
        const sellerQuery = `SELECT name FROM users WHERE id = $1`
        const sellerResult = await pool.query(sellerQuery, [sellBy])

        if (sellerResult.rows.length > 0) {
          sellByName = sellerResult.rows[0].name
        }
      }

      const paymentsQuery = `SELECT * FROM payment WHERE machine_id = $1 ORDER BY transaction_date ASC`
      const paymentsResult = await pool.query(paymentsQuery, [id])

      const payments = paymentsResult.rows.map((payment, index) => ({
        ...payment,
        track: index + 1,
      }))

      machine.payments = payments
      machine.sell_by_name = sellByName

      const machineStatus = await pool.query(
        `SELECT status FROM order_items WHERE machine_id = $1`,
        [id]
      )

      machine.status =
        machineStatus.rows.length > 0 ? machineStatus.rows[0].status : null

      let machineFilled = 0
      let unmatchedFields: any[] = []

      const hasContractImages =
        (Array.isArray(machine.contract_images_pdf) &&
          machine.contract_images_pdf.length > 0) ||
        (Array.isArray(machine.contract_images_png) &&
          machine.contract_images_png.length > 0)

      if (hasContractImages) machineFilled++

      let checkingFields = []

      if (machine.type === "machine") {
        checkingFields = [...saleFields]
      } else {
        checkingFields = [...partFields]
      }

      checkingFields.forEach((field) => {
        const value = machine[field]
        const isFilled = Array.isArray(value)
          ? value.length > 0
          : typeof value === "number"
            ? ["price"].includes(field)
              ? value !== null && !isNaN(value)
              : true
            : typeof value === "string"
              ? value.trim() !== "" && value !== "null"
              : value !== null && value !== undefined

        if (isFilled) {
          machineFilled++
        } else {
          unmatchedFields.push(field)
        }
      })

      const totalFields = checkingFields.length + 1

      const percentage_completion = Math.round(
        (machineFilled / totalFields) * 100
      )

      const installmentQuery = await pool.query(
        `SELECT * FROM machine_installments WHERE sale_id = $1 ORDER BY date ASC`,
        [id]
      )

      const installments = installmentQuery.rows

      let editAllowed = false

      if (customer && customer?.ownership === Number(uid)) {
        editAllowed = true
      } else if (machine && machine?.sell_by === Number(uid)) {
        editAllowed = true
      } else if (isAdmin) {
        editAllowed = true
      } else if (
        user?.designation === "Customer Relationship Manager (After Sales)" &&
        !user?.limited_access
      ) {
        editAllowed = true
      } else if (user?.customer_full_access) {
        editAllowed = true
      } else {
        editAllowed = false
      }

      return NextResponse.json(
        {
          customer,
          machine,
          percentage_completion,
          unmatchedFields,
          installments,
          editAllowed,
        },
        { status: 200 }
      )
    } else {
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 500 })
      }

      const machineQuery = `
  SELECT s.*, 
         CASE WHEN cm.id IS NOT NULL THEN TRUE ELSE FALSE END AS cancelled_detail,
         cm.id AS cancelled_id,
        co.commission_issued AS commission_issued,
         cm.created_at AS cancelled_at,
         cm.issued AS cancelled_issued,
         cm.reason AS cancelled_reason
  FROM sale s
  LEFT JOIN cancelled_machine cm ON s.id = cm.machine_id
  LEFT JOIN commissions co ON s.id = co.sale_id 
  WHERE s.id = $1
`
      const machineResult = await pool.query(machineQuery, [id])

      if (machineResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Machine not found" },
          { status: 404 }
        )
      }

      const machine = machineResult.rows[0]
      const customerId = machine.customer_id
      const sellBy = machine.sell_by

      const customerQuery = `
      SELECT 
    c.*,
    u.name AS ownership_name
FROM customer c
LEFT JOIN users u ON u.id = c.ownership
WHERE c.id = $1`
      const customerResult = await pool.query(customerQuery, [customerId])

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 }
        )
      }

      const customer = customerResult.rows[0]

      if (user.designation === "Dealer") {
        if (user.id !== customer.ownership) {
          return NextResponse.json(
            { message: "You don't have access to this page" },
            { status: 404 }
          )
        }
      }

      if (user.limited_access) {
        if (
          user.designation === "Social Media Manager" ||
          user.designation === "Customer Relationship Manager"
        ) {
          if (user.id !== customer.lead) {
            return NextResponse.json(
              { message: "You don't have access to this page" },
              { status: 404 }
            )
          }
        }

        if (user.designation === "Sales") {
          if (user.id !== customer.ownership) {
            return NextResponse.json(
              { message: "You don't have access to this page" },
              { status: 404 }
            )
          }
        }
      }

      let sellByName = null
      if (sellBy) {
        const sellerQuery = `SELECT name FROM users WHERE id = $1`
        const sellerResult = await pool.query(sellerQuery, [sellBy])

        if (sellerResult.rows.length > 0) {
          sellByName = sellerResult.rows[0].name
        }
      }

      const paymentsQuery = `SELECT * FROM payment WHERE machine_id = $1 ORDER BY transaction_date ASC`
      const paymentsResult = await pool.query(paymentsQuery, [id])

      const payments = paymentsResult.rows.map((payment, index) => ({
        ...payment,
        track: index + 1,
      }))

      machine.payments = payments
      machine.sell_by_name = sellByName

      const machineStatus = await pool.query(
        `SELECT status FROM order_items WHERE machine_id = $1`,
        [id]
      )

      machine.status =
        machineStatus.rows.length > 0 ? machineStatus.rows[0].status : null

      let machineFilled = 0
      let unmatchedFields: any[] = []

      const hasContractImages =
        (Array.isArray(machine.contract_images_pdf) &&
          machine.contract_images_pdf.length > 0) ||
        (Array.isArray(machine.contract_images_png) &&
          machine.contract_images_png.length > 0)

      if (hasContractImages) machineFilled++

      let checkingFields = []

      if (machine.type === "machine") {
        checkingFields = [...saleFields]
      } else {
        checkingFields = [...partFields]
      }

      checkingFields.forEach((field) => {
        const value = machine[field]
        const isFilled = Array.isArray(value)
          ? value.length > 0
          : typeof value === "number"
            ? ["price"].includes(field)
              ? value !== null && !isNaN(value)
              : true
            : typeof value === "string"
              ? value.trim() !== "" && value !== "null"
              : value !== null && value !== undefined

        if (isFilled) {
          machineFilled++
        } else {
          unmatchedFields.push(field)
        }
      })

      const totalFields = checkingFields.length + 1

      const percentage_completion = Math.round(
        (machineFilled / totalFields) * 100
      )
      const installmentQuery = await pool.query(
        `SELECT * FROM machine_installments WHERE sale_id = $1 ORDER BY date ASC`,
        [id]
      )

      const installments = installmentQuery.rows

      let editAllowed = false

      if (customer && customer?.ownership === Number(uid)) {
        editAllowed = true
      } else if (machine && machine?.sell_by === Number(uid)) {
        editAllowed = true
      } else if (isAdmin) {
        editAllowed = true
      } else if (
        user?.designation === "Customer Relationship Manager (After Sales)" &&
        !user?.limited_access
      ) {
        editAllowed = true
      } else if (user?.customer_full_access) {
        editAllowed = true
      } else {
        editAllowed = false
      }

      console.log(editAllowed)

      return NextResponse.json(
        {
          customer,
          machine,
          percentage_completion,
          unmatchedFields,
          installments,
          editAllowed,
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error("Error fetching data:", error)
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const data = await req.json()
    const { ...updates } = data
    const { id, uid } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 })
    }

    const fields: string[] = []
    const values = []

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`)
        values.push(value)
      }
    })

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 }
      )
    }

    values.push(id)
    const query = `
          UPDATE sale 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING *
      `

    const result = await pool.query(query, values)

    try {
      const logMSG = generateLog(data, "Machine updated")
      addLog({
        text: logMSG,
        user_id: uid,
        customer_id: result.rows[0].customer_id,
        sale_id: result.rows[0].id,
      })
    } catch (error) {
      console.log(error)
    }

    console.log("data updated successfully")
    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating data:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    await client.query(
      `UPDATE order_items
       SET machine_id = NULL,
           customer_id = NULL,
           booked = FALSE,
           booking_date = NULL,
           booked_by = NULL
       WHERE machine_id = $1`,
      [id]
    )

    await client.query(`UPDATE logs SET sale_id = NULL WHERE sale_id = $1`, [
      id,
    ])

    const paymentResult = await client.query(
      `SELECT image FROM payment WHERE machine_id = $1`,
      [id]
    )
    for (const row of paymentResult.rows) {
      const imagePath = row.image
      if (imagePath && !imagePath.includes("https")) {
        try {
          await admin.storage().bucket().file(imagePath).delete()
        } catch (err: any) {
          console.warn(
            `Failed to delete payment image: ${imagePath}`,
            err.message
          )
        }
      }
    }

    await client.query(`DELETE FROM payment WHERE machine_id = $1`, [id])

    const saleResult = await client.query(
      `SELECT customer_id, contract_images_png, other_images_png, machine_nameplate_images, final_handover_images, installation_report, handshake_images FROM sale WHERE id = $1`,
      [id]
    )

    let customer_id = null

    if (saleResult.rows.length > 0) {
      const saleRow = saleResult.rows[0]
      customer_id = saleRow?.customer_id

      const imageFields = [
        "contract_images_png",
        "other_images_png",
        "machine_nameplate_images",
        "final_handover_images",
        "installation_report",
        "handshake_images",
      ]

      for (const field of imageFields) {
        const images = saleRow[field]
        if (Array.isArray(images)) {
          for (const img of images) {
            if (img && !img.includes("https")) {
              try {
                await deleteObject(ref(storage, img))
              } catch (err: any) {
                console.warn(`Failed to delete image: ${img}`, err.message)
              }
            }
          }
        }
      }
    }

    if (customer_id) {
      const saleQuery = await client.query(
        `
  SELECT COUNT(*) 
  FROM sale
  WHERE customer_id = $1
  AND id <> $2
  `,
        [customer_id, id]
      )

      const remainingSales = Number(saleQuery.rows[0].count)

      if (remainingSales === 0) {
        await client.query(`UPDATE customer SET member = $1 WHERE id = $2`, [
          false,
          customer_id,
        ])
      }
    }

    await client.query(`DELETE FROM sale WHERE id = $1`, [id])

    await client.query("COMMIT")

    return NextResponse.json(
      { message: "Machine deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error deleting machine:", error)
    return NextResponse.json(
      { message: "Error deleting machine" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export const revalidate = 0
