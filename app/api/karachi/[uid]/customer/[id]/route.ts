import pool from "@/config/db"
import { partFields, profileFields, saleFields } from "@/constants/data"
import { addLog } from "@/lib/addLog"
import { checkSuperadmin } from "@/lib/checkSuperadmin"
import DeleteStorageBackend from "@/lib/delete-storage-backend"
import { generateLog } from "@/lib/generateLog"
import { sendNotification } from "@/lib/sendNotification"
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile"
import { sendNotificationToSMM } from "@/lib/sendNotificationToSMM"
import { NextRequest, NextResponse } from "next/server"
import { NOTIFICATION_TYPES } from "@/constants/notifications"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const { id } = await params
  const { uid } = await params

  try {
    const isAdmin = await checkSuperadmin(uid)

    if (isAdmin) {
      const customerQuery = `
        SELECT c.*, u.name AS ownership_name, l.name AS lead_name
        FROM customer c
        LEFT JOIN users u ON c.ownership = u.id
        LEFT JOIN users l ON c.lead = l.id
        WHERE c.id = $1
    `
      const customerResult = await pool.query(customerQuery, [id])

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 }
        )
      }

      const customer = customerResult.rows[0]

      let filledCount = 0
      profileFields.forEach((field) => {
        const value = customer[field]
        const isFilled =
          field === "rating"
            ? typeof value === "number" && value > 0
            : Array.isArray(value)
              ? value.length > 0
              : typeof value === "number"
                ? true
                : typeof value === "string"
                  ? value.trim() !== "" && value !== "null"
                  : value !== null && value !== undefined
        if (isFilled) filledCount++
      })

      const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 ORDER BY contract_date ASC`
      const machinesResult = await pool.query(machinesQuery, [id])
      let machines = machinesResult.rows

      let saleFilledCount = 0
      const customerTotalFields = profileFields.length

      const machineIds = machines.map((m) => m.id)

      // Fetch order item statuses for all machines in one query
      let orderItemsMap = new Map()

      if (machineIds.length > 0) {
        const orderItemsResult = await pool.query(
          `SELECT machine_id, status FROM order_items WHERE machine_id = ANY($1::int[])`,
          [machineIds]
        )

        orderItemsResult.rows.forEach((row) => {
          orderItemsMap.set(row.machine_id, row.status)
        })
      }

      machines = machines.map((machine) => {
        let machineFilled = 0

        // Handle contract_images as one field
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

        // Handle other saleFields
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

          if (isFilled) machineFilled++
        })

        const totalFields = checkingFields.length + 1

        saleFilledCount += machineFilled

        return {
          ...machine,
          percentage_completion: Math.round(
            (machineFilled / totalFields) * 100
          ),
          status: orderItemsMap.get(machine.id) || null,
        }
      })

      const overallCompletion = Math.round(
        (filledCount / customerTotalFields) * 100
      )

      let billReceived = 0
      let payments = []

      if (machineIds.length > 0) {
        const paymentsQuery = `SELECT * FROM payment WHERE machine_id = ANY($1)`
        const paymentsResult = await pool.query(paymentsQuery, [machineIds])
        payments = paymentsResult.rows

        const totalReceivedQuery = `SELECT SUM(amount) AS total_received FROM payment WHERE machine_id = ANY($1) AND clearance_date IS NOT NULL`
        const totalReceivedResult = await pool.query(totalReceivedQuery, [
          machineIds,
        ])
        billReceived = totalReceivedResult.rows[0].total_received || 0
      }

      machines = machines.map((machine) => ({
        ...machine,
        payments: payments.filter(
          (payment) => payment.machine_id === machine.id
        ),
      }))

      const billTotal = machines.reduce(
        (sum, machine) => sum + (Number(machine.price) || 0),
        0
      )

      customer.machines = machines
      customer.bill_received = parseFloat(`${billReceived}`)
      customer.bill_total = parseFloat(billTotal)
      customer.profile_completion = overallCompletion

      return NextResponse.json(customer, { status: 200 })
    } else {
      const customerQuery = `
          SELECT c.*, u.name AS ownership_name
          FROM customer c
          LEFT JOIN users u ON c.ownership = u.id
          WHERE c.id = $1
      `
      const customerResult = await pool.query(customerQuery, [id])

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 }
        )
      }

      const customer = customerResult.rows[0]

      // 2. Get all machines related to this customer
      const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 AND sell_by = $2 ORDER BY contract_date ASC`
      const machinesResult = await pool.query(machinesQuery, [id, uid])

      let machines = machinesResult.rows

      // 3. Get all payments related to these machines & calculate total received
      const machineIds = machines.map((m) => m.id)

      let billReceived = 0
      let payments = []

      if (machineIds.length > 0) {
        // Fetch all payments related to these machines
        const paymentsQuery = `SELECT * FROM payment WHERE machine_id = ANY($1)`
        const paymentsResult = await pool.query(paymentsQuery, [machineIds])
        payments = paymentsResult.rows

        // Calculate total received
        const totalReceivedQuery = `SELECT SUM(amount) AS total_received FROM payment WHERE machine_id = ANY($1)`
        const totalReceivedResult = await pool.query(totalReceivedQuery, [
          machineIds,
        ])
        billReceived = totalReceivedResult.rows[0].total_received || 0
      }

      // 4. Attach payments to their respective machines
      machines = machines.map((machine) => ({
        ...machine,
        payments: payments.filter(
          (payment) => payment.machine_id === machine.id
        ),
      }))

      // 5. Calculate total price of all machines
      const billTotal = machines.reduce(
        (sum, machine) => sum + (Number(machine.price) || 0),
        0
      )

      // 6. Attach machines & calculated values to customer object
      customer.machines = machines
      customer.bill_received = parseFloat(`${billReceived}`)
      customer.bill_total = parseFloat(billTotal)

      return NextResponse.json(customer, { status: 200 })
    }
  } catch (error: any) {
    console.error("Error fetching data: ", error)
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string; id: string }> }
) {
  const searchParams = req.nextUrl.searchParams
  const notify = searchParams.get("notify")
  const userid = searchParams.get("userid")

  try {
    const { uid } = await params

    const data = await req.json()
    const { ...updates } = data
    const { id } = await params

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
          UPDATE customer 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING id, lead, ownership, name, owner, member
      `

    const result = await pool.query(query, values)

    if (result.rows[0].ownership !== uid) {
      if (result.rows[0].lead) {
        sendNotificationToSMM(
          result.rows[0].lead,
          `${result.rows[0]?.name || result.rows[0]?.owner}`,
          `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`,
          result.rows[0].ownership
        )
      }

      if (result.rows[0].ownership) {
        sendNotification(
          `${result.rows[0]?.name}-${result.rows[0]?.owner} assigned to you`,
          `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`,
          result.rows[0].ownership,
          NOTIFICATION_TYPES.customer_assigned.title,
          NOTIFICATION_TYPES.customer_assigned.category
        )
        sendNotificationToMobile(
          `${result.rows[0]?.name}-${result.rows[0]?.owner} assigned to you`,
          "Customer",
          result.rows[0].ownership,
          result.rows[0],
          "client",
          `/dashboard/customer/${result.rows[0].id}`
        )
      }
    }

    try {
      const logMSG = generateLog(data, "Customer updated")

      addLog({ text: logMSG, user_id: uid, customer_id: result.rows[0].id })
    } catch (error) {
      console.log(error)
    }

    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating inventory data:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string; id: string }> }
) {
  try {
    const { uid } = await params

    const isAdmin = await checkDeleteUser(uid)

    if (!isAdmin) {
      return NextResponse.json(
        { message: "You are not allowed to perform this action" },
        { status: 500 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 })
    }

    const imgQuery = await pool.query(
      `SELECT image FROM customer WHERE id = $1`,
      [id]
    )
    const img = imgQuery.rows?.[0]?.image ?? null
    await DeleteStorageBackend(img)
    await pool.query(`DELETE FROM feedback WHERE customer_id = $1`, [id])

    const visitResult = await pool.query(
      `SELECT * FROM visit WHERE customer_id = $1`,
      [id]
    )

    if (visitResult.rows.length > 0) {
      for (const item of visitResult.rows) {
        const image = item.image
        await DeleteStorageBackend(image)
      }
      await pool.query(`DELETE FROM visit WHERE customer_id = $1`, [id])
    }

    const saleResult = await pool.query(
      `SELECT * FROM sale WHERE customer_id = $1`,
      [id]
    )

    if (saleResult.rows.length > 0) {
      const sale = saleResult.rows[0]

      const machineId = sale.id
      const paymentResult = await pool.query(
        `SELECT * FROM payment WHERE machine_id = $1`,
        [machineId]
      )

      if (paymentResult.rows.length > 0) {
        for (const payment of paymentResult.rows) {
          const image = payment.image
          await DeleteStorageBackend(image)
        }

        await pool.query(`DELETE FROM payment WHERE machine_id = $1`, [
          machineId,
        ])
      }

      await pool.query(`DELETE FROM sale WHERE customer_id = $1`, [id])
    }

    await pool.query(`DELETE FROM customer WHERE id = $1`, [id])

    return NextResponse.json({ message: "Customer Deleted" }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}

async function checkDeleteUser(id: string) {
  if (!id) throw new Error("User ID is missing")

  const userQuery = await pool.query(
    `SELECT id, designation, full_access, customer_delete_access FROM users WHERE id = $1`,
    [id]
  )

  let user = userQuery.rows[0]

  if (!user) throw new Error("User not found")

  return (
    user.designation === "Owner" ||
    user.full_access === true ||
    user.customer_delete_access === true
  )
}
