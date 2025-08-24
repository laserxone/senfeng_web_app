import {karachi_pool as pool} from "@/config/db";
import { storage } from "@/config/firebase";
import { saleFields } from "@/constants/data";
import { addLog } from "@/lib/addLog";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { generateLog } from "@/lib/generateLog";
import { deleteObject, ref } from "firebase/storage";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id, uid } = await params; // Machine ID



  try {

    const isAdmin = await checkSuperadmin(uid)

    if (isAdmin) {


      // 1. Get the machine and its customer ID
      const machineQuery = `SELECT * FROM sale WHERE id = $1`;
      const machineResult = await pool.query(machineQuery, [id]);

      if (machineResult.rows.length === 0) {
        return NextResponse.json({ message: "Machine not found" }, { status: 404 });
      }

      const machine = machineResult.rows[0];
      const customerId = machine.customer_id;
      const sellBy = machine.sell_by; // Get sell_by ID

      // 2. Get customer details
      const customerQuery = `SELECT * FROM customer WHERE id = $1`;
      const customerResult = await pool.query(customerQuery, [customerId]);

      if (customerResult.rows.length === 0) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }

      const customer = customerResult.rows[0];

      let sellByName = null;
      if (sellBy) {
        const sellerQuery = `SELECT name FROM users WHERE id = $1`;
        const sellerResult = await pool.query(sellerQuery, [sellBy]);

        if (sellerResult.rows.length > 0) {
          sellByName = sellerResult.rows[0].name;
        }
      }

      // 4. Get all payments related to this machine, ordered by transaction_date
      const paymentsQuery = `SELECT * FROM payment WHERE machine_id = $1 ORDER BY transaction_date ASC`;
      const paymentsResult = await pool.query(paymentsQuery, [id]);

      // 5. Add track number to each payment
      const payments = paymentsResult.rows.map((payment, index) => ({
        ...payment,
        track: index + 1, // Starts from 1
      }));

      // 6. Attach payments and sell_by_name to the machine object
      machine.payments = payments;
      machine.sell_by_name = sellByName; // Attach seller's name

      const machineStatus = await pool.query(`SELECT status FROM order_items WHERE machine_id = $1`, [id])

      machine.status = machineStatus.rows.length > 0 ? machineStatus.rows[0].status : null

      let machineFilled = 0;
      let unmatchedFields = [];

      const hasContractImages =
        (Array.isArray(machine.contract_images_pdf) && machine.contract_images_pdf.length > 0) ||
        (Array.isArray(machine.contract_images_png) && machine.contract_images_png.length > 0);

      if (hasContractImages) machineFilled++;

      saleFields.forEach(field => {
        const value = machine[field];
        const isFilled =
          Array.isArray(value)
            ? value.length > 0
            : typeof value === 'number'
              ? ['price'].includes(field)
                ? value !== null && !isNaN(value)
                : true
              : typeof value === 'string'
                ? value.trim() !== '' && value !== 'null'
                : value !== null && value !== undefined;

        if (isFilled) {
          machineFilled++;
        } else {
          unmatchedFields.push(field);
        }
      });

      const totalFields = saleFields.length + 1;



      const percentage_completion = Math.round((machineFilled / totalFields) * 100)

      const installmentQuery = await pool.query(`SELECT * FROM machine_installments WHERE sale_id = $1 ORDER BY date ASC`, [id])

      const installments = installmentQuery.rows

      return NextResponse.json({ customer, machine, percentage_completion, unmatchedFields, installments }, { status: 200 });

    } else {
      const userQuery = await pool.query(`SELECT id, designation, limited_access FROM users WHERE id = $1`, [uid])

      const user = userQuery.rows[0]

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 500 })
      }

      // 1. Get the machine and its customer ID
      const machineQuery = `SELECT * FROM sale WHERE id = $1`;
      const machineResult = await pool.query(machineQuery, [id]);

      if (machineResult.rows.length === 0) {
        return NextResponse.json({ message: "Machine not found" }, { status: 404 });
      }

      const machine = machineResult.rows[0];
      const customerId = machine.customer_id;
      const sellBy = machine.sell_by; // Get sell_by ID

      // 2. Get customer details
      const customerQuery = `SELECT * FROM customer WHERE id = $1`;
      const customerResult = await pool.query(customerQuery, [customerId]);

      if (customerResult.rows.length === 0) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 });
      }

      const customer = customerResult.rows[0];

      if (user.designation === 'Dealer') {
        if (user.id !== customer.ownership) {
          return NextResponse.json({ message: "You don't have access to this page" }, { status: 404 })
        }
      }

      if (user.limited_access) {
        if (user.designation === 'Social Media Manager' || user.designation === 'Customer Relationship Manager') {
          if (user.id !== customer.lead) {
            return NextResponse.json({ message: "You don't have access to this page" }, { status: 404 })
          }
        }

        if (user.designation === 'Sales') {
          if (user.id !== customer.ownership) {
            return NextResponse.json({ message: "You don't have access to this page" }, { status: 404 })
          }
        }
      }

      let sellByName = null;
      if (sellBy) {
        const sellerQuery = `SELECT name FROM users WHERE id = $1`;
        const sellerResult = await pool.query(sellerQuery, [sellBy]);

        if (sellerResult.rows.length > 0) {
          sellByName = sellerResult.rows[0].name;
        }
      }

      // 4. Get all payments related to this machine, ordered by transaction_date
      const paymentsQuery = `SELECT * FROM payment WHERE machine_id = $1 ORDER BY transaction_date ASC`;
      const paymentsResult = await pool.query(paymentsQuery, [id]);

      // 5. Add track number to each payment
      const payments = paymentsResult.rows.map((payment, index) => ({
        ...payment,
        track: index + 1, // Starts from 1
      }));

      // 6. Attach payments and sell_by_name to the machine object
      machine.payments = payments;
      machine.sell_by_name = sellByName; // Attach seller's name

      const machineStatus = await pool.query(`SELECT status FROM order_items WHERE machine_id = $1`, [id])

      machine.status = machineStatus.rows.length > 0 ? machineStatus.rows[0].status : null

      let machineFilled = 0;
      let unmatchedFields = [];

      const hasContractImages =
        (Array.isArray(machine.contract_images_pdf) && machine.contract_images_pdf.length > 0) ||
        (Array.isArray(machine.contract_images_png) && machine.contract_images_png.length > 0);

      if (hasContractImages) machineFilled++;

      saleFields.forEach(field => {
        const value = machine[field];
        const isFilled =
          Array.isArray(value)
            ? value.length > 0
            : typeof value === 'number'
              ? ['price'].includes(field)
                ? value !== null && !isNaN(value)
                : true
              : typeof value === 'string'
                ? value.trim() !== '' && value !== 'null'
                : value !== null && value !== undefined;

        if (isFilled) {
          machineFilled++;
        } else {
          unmatchedFields.push(field);
        }
      });

      const totalFields = saleFields.length + 1;



      const percentage_completion = Math.round((machineFilled / totalFields) * 100)
      const installmentQuery = await pool.query(`SELECT * FROM machine_installments WHERE sale_id = $1 ORDER BY date ASC`, [id])

      const installments = installmentQuery.rows


      return NextResponse.json({ customer, machine, percentage_completion, unmatchedFields, installments }, { status: 200 });

    }


  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
  }
}


export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id, uid } = await params

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE sale 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING *
      `;

    const result = await pool.query(query, values);

    try {
      const logMSG = generateLog(data, "Machine updated")
      addLog({ text: logMSG, user_id: uid, customer_id: result.rows[0].customer_id, sale_id: result.rows[0].id })
    } catch (error) {
      console.log(error)
    }


    console.log("data updated successfully");
    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {


  const { id } = await params

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Step 1: Update order_items
    await client.query(
      `UPDATE order_items
       SET machine_id = NULL,
           customer_id = NULL,
           booked = FALSE,
           booking_date = NULL,
           booked_by = NULL
       WHERE machine_id = $1`,
      [id]
    );

    // Step 2: Update logs table
    await client.query(
      `UPDATE logs SET sale_id = NULL WHERE sale_id = $1`,
      [id]
    );

    // Step 3: Get payment images
    const paymentResult = await client.query(
      `SELECT image FROM payment WHERE machine_id = $1`,
      [id]
    );
    for (const row of paymentResult.rows) {
      const imagePath = row.image;
      if (imagePath && !imagePath.includes("https")) {
        try {
          await deleteObject(ref(storage, imagePath));
        } catch (err) {
          console.warn(`Failed to delete payment image: ${imagePath}`, err.message);
        }
      }
    }

    // Step 4: Delete payments
    await client.query(`DELETE FROM payment WHERE machine_id = $1`, [id]);

    // Step 5: Get sale images to delete
    const saleResult = await client.query(`SELECT contract_images_png, other_images_png, machine_nameplate_images, final_handover_images, installation_report, handshake_images FROM sale WHERE id = $1`, [id]);

    if (saleResult.rowCount > 0) {
      const saleRow = saleResult.rows[0];

      const imageFields = [
        "contract_images_png",
        "other_images_png",
        "machine_nameplate_images",
        "final_handover_images",
        "installation_report",
        "handshake_images",
      ];

      for (const field of imageFields) {
        const images = saleRow[field];
        if (Array.isArray(images)) {
          for (const img of images) {
            if (img && !img.includes("https")) {
              try {
                await deleteObject(ref(storage, img));
              } catch (err) {
                console.warn(`Failed to delete image: ${img}`, err.message);
              }
            }
          }
        }
      }
    }

    // Step 6: Delete sale
    await client.query(`DELETE FROM sale WHERE id = $1`, [id]);

    await client.query("COMMIT");

    return NextResponse.json({ message: "Machine deleted successfully" }, { status: 200 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting machine:", error);
    return NextResponse.json({ message: "Error deleting machine" }, { status: 500 });
  } finally {
    client.release();
  }
}

export const revalidate = 0