import pool from "@/config/db";
import { partFields, profileFields, saleFields } from "@/constants/data";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> },
) {
  const { id, uid } = await params;

  try {
    const isAdmin = await checkSuperadmin(uid);

    if (isAdmin) {
      const customerQuery = `
        SELECT c.*, u.name AS ownership_name, l.name AS lead_name
        FROM customer c
        LEFT JOIN users u ON c.ownership = u.id
        LEFT JOIN users l ON c.lead = l.id
        WHERE c.id = $1
    `;
      const customerResult = await pool.query(customerQuery, [id]);

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 },
        );
      }

      const customer = customerResult.rows[0];

      let filledCount = 0;
      let missingFields: string[] = [];
      profileFields.forEach((field) => {
        const value = customer[field];
        const isFilled =
          field === "rating"
            ? typeof value === "number" && value > 0
            : Array.isArray(value)
              ? value.length > 0
              : typeof value === "number"
                ? true
                : typeof value === "string"
                  ? value.trim() !== "" && value !== "null"
                  : value !== null && value !== undefined;
        if (isFilled) filledCount++;
        else missingFields.push(field);
      });

      const machinesQuery = `
            SELECT s.*, 
         CASE WHEN cm.id IS NOT NULL THEN TRUE ELSE FALSE END AS cancelled_detail,
         cm.id AS cancelled_id,
         cm.created_at AS cancelled_at,
         cm.issued AS cancelled_issued,
         cm.reason AS cancelled_reason,
         COALESCE(
      (
        SELECT ARRAY_AGG(
          COALESCE(
            (
              SELECT o.title
              FROM order_items oi
              JOIN orders o ON o.id = oi.order_id
              WHERE oi.machine_serial = serial.machine_serial
              ORDER BY oi.id DESC
              LIMIT 1
            ),
            'Nil'
          )
          ORDER BY serial.idx
        )
        FROM unnest(s.order_no_arr) WITH ORDINALITY 
          AS serial(machine_serial, idx)
      ),
      ARRAY[]::text[]
    ) AS shipment_title
  FROM sale s
  LEFT JOIN cancelled_machine cm ON s.id = cm.machine_id
             WHERE s.customer_id = $1 ORDER BY s.contract_date ASC
            `;
      const partsQuery = `SELECT * FROM savedinvoices_karachi WHERE customer_id = $1 ORDER BY id ASC`;
      const machinesResult = await pool.query(machinesQuery, [id]);
      const partsResult = await pool.query(partsQuery, [id]);
      let machines = machinesResult.rows;
      let parts = partsResult.rows;
      let saleFilledCount = 0;
      const customerTotalFields = profileFields.length;

      const machineIds = machines.map((m) => m.id);
      const partsIds = parts.map((p) => p.id);

      // Fetch order item statuses for all machines in one query
      let orderItemsMap = new Map();

      if (machineIds.length > 0) {
        const orderItemsResult = await pool.query(
          `SELECT machine_id, status FROM order_items WHERE machine_id = ANY($1::int[])`,
          [machineIds],
        );

        orderItemsResult.rows.forEach((row) => {
          orderItemsMap.set(row.machine_id, row.status);
        });
      }

      machines = machines.map((machine) => {
        let machineFilled = 0;

        // Handle contract_images as one field
        const hasContractImages =
          (Array.isArray(machine.contract_images_pdf) &&
            machine.contract_images_pdf.length > 0) ||
          (Array.isArray(machine.contract_images_png) &&
            machine.contract_images_png.length > 0);

        if (hasContractImages) machineFilled++;

        let checkingFields = [];

        if (machine.type === "machine") {
          checkingFields = [...saleFields];
        } else {
          checkingFields = [...partFields];
        }

        // Handle other saleFields
        checkingFields.forEach((field) => {
          const value = machine[field];
          const isFilled = Array.isArray(value)
            ? value.length > 0
            : typeof value === "number"
              ? ["price"].includes(field)
                ? value !== null && !isNaN(value)
                : true
              : typeof value === "string"
                ? value.trim() !== "" && value !== "null"
                : value !== null && value !== undefined;

          if (isFilled) machineFilled++;
        });

        const totalFields = checkingFields.length + 1;

        saleFilledCount += machineFilled;

        return {
          ...machine,
          percentage_completion: Math.round(
            (machineFilled / totalFields) * 100,
          ),
          status: orderItemsMap.get(machine.id) || null,
        };
      });

      const overallCompletion = Math.round(
        (filledCount / customerTotalFields) * 100,
      );

      let billReceived = 0;
      let payments: any[] = [];

      if (machineIds.length > 0) {
        const paymentsQuery = `SELECT id, machine_id, note, amount, mode, received_by, clearance_date, transaction_date FROM payment WHERE machine_id = ANY($1)`;
        const paymentsResult = await pool.query(paymentsQuery, [machineIds]);
        payments = paymentsResult.rows;

        const totalReceivedQuery = `SELECT SUM(amount) AS total_received FROM payment WHERE machine_id = ANY($1) AND clearance_date IS NOT NULL`;
        const totalReceivedResult = await pool.query(totalReceivedQuery, [
          machineIds,
        ]);
        billReceived = totalReceivedResult.rows[0].total_received || 0;
      }

      machines = machines.map((machine) => ({
        ...machine,
        payments: payments.filter(
          (payment) => payment.machine_id === machine.id,
        ),
      }));

      const billTotal = machines.reduce(
        (sum, machine) => sum + (Number(machine.price) || 0),
        0,
      );

      if (partsIds.length > 0) {
        const paymentsQuery = `SELECT * FROM customer_parts_karachi WHERE part_id = ANY($1)`;
        const paymentsResult = await pool.query(paymentsQuery, [partsIds]);
        payments = paymentsResult.rows;
      }

      parts = parts.map((part) => ({
        ...part,
        payments: payments.filter((payment) => payment.part_id === part.id),
      }));

      customer.machines = machines;
      customer.bill_received = parseFloat(`${billReceived}`);
      customer.bill_total = parseFloat(billTotal);
      customer.profile_completion = overallCompletion;
      customer.missing_fields = missingFields;
      customer.parts = parts;

      return NextResponse.json(
        {
          customer,
        },
        { status: 200 },
      );
    } else {
      const customerQuery = `
        SELECT c.*, u.name AS ownership_name, l.name AS lead_name
        FROM customer c
        LEFT JOIN users u ON c.ownership = u.id
        LEFT JOIN users l ON c.lead = l.id
        WHERE c.id = $1
    `;
      const customerResult = await pool.query(customerQuery, [id]);

      if (customerResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Customer not found" },
          { status: 404 },
        );
      }

      const customer = customerResult.rows[0];

      const userQuery = await pool.query(
        `SELECT id, designation, limited_access FROM users WHERE id = $1`,
        [uid],
      );

      const user = userQuery.rows[0];

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 500 },
        );
      }

      if (user.designation === "Dealer") {
        if (user.id !== customer.ownership) {
          return NextResponse.json(
            { message: "You don't have access to this page" },
            { status: 404 },
          );
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
              { status: 404 },
            );
          }
        }

        if (user.designation === "Sales") {
          if (user.id !== customer.ownership) {
            return NextResponse.json(
              { message: "You don't have access to this page" },
              { status: 404 },
            );
          }
        }
      }

      let filledCount = 0;
      let missingFields: string[] = [];
      profileFields.forEach((field) => {
        const value = customer[field];
        const isFilled =
          field === "rating"
            ? typeof value === "number" && value > 0
            : Array.isArray(value)
              ? value.length > 0
              : typeof value === "number"
                ? true
                : typeof value === "string"
                  ? value.trim() !== "" && value !== "null"
                  : value !== null && value !== undefined;
        if (isFilled) filledCount++;
        else missingFields.push(field);
      });

      const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 ORDER BY contract_date ASC`;
      const partsQuery = `SELECT * FROM savedinvoices_karachi WHERE customer_id = $1 ORDER BY id ASC`;
      const machinesResult = await pool.query(machinesQuery, [id]);
      const partsResult = await pool.query(partsQuery, [id]);
      let machines = machinesResult.rows;
      let parts = partsResult.rows;
      let saleFilledCount = 0;
      const customerTotalFields = profileFields.length;

      const machineIds = machines.map((m) => m.id);
      const partsIds = parts.map((p) => p.id);

      // Fetch order item statuses for all machines in one query
      let orderItemsMap = new Map();

      if (machineIds.length > 0) {
        const orderItemsResult = await pool.query(
          `SELECT machine_id, status FROM order_items WHERE machine_id = ANY($1::int[])`,
          [machineIds],
        );

        orderItemsResult.rows.forEach((row) => {
          orderItemsMap.set(row.machine_id, row.status);
        });
      }

      machines = machines.map((machine) => {
        let machineFilled = 0;

        // Handle contract_images as one field
        const hasContractImages =
          (Array.isArray(machine.contract_images_pdf) &&
            machine.contract_images_pdf.length > 0) ||
          (Array.isArray(machine.contract_images_png) &&
            machine.contract_images_png.length > 0);

        if (hasContractImages) machineFilled++;

        let checkingFields = [];

        if (machine.type === "machine") {
          checkingFields = [...saleFields];
        } else {
          checkingFields = [...partFields];
        }

        // Handle other saleFields
        checkingFields.forEach((field) => {
          const value = machine[field];
          const isFilled = Array.isArray(value)
            ? value.length > 0
            : typeof value === "number"
              ? ["price"].includes(field)
                ? value !== null && !isNaN(value)
                : true
              : typeof value === "string"
                ? value.trim() !== "" && value !== "null"
                : value !== null && value !== undefined;

          if (isFilled) machineFilled++;
        });

        const totalFields = checkingFields.length + 1;

        saleFilledCount += machineFilled;

        return {
          ...machine,
          percentage_completion: Math.round(
            (machineFilled / totalFields) * 100,
          ),
          status: orderItemsMap.get(machine.id) || null,
        };
      });

      const overallCompletion = Math.round(
        (filledCount / customerTotalFields) * 100,
      );

      let billReceived = 0;
      let payments: any[] = [];

      if (machineIds.length > 0) {
        const paymentsQuery = `SELECT id, machine_id, note, amount, mode, received_by, clearance_date, transaction_date FROM payment WHERE machine_id = ANY($1)`;
        const paymentsResult = await pool.query(paymentsQuery, [machineIds]);
        payments = paymentsResult.rows;

        const totalReceivedQuery = `SELECT SUM(amount) AS total_received FROM payment WHERE machine_id = ANY($1) AND clearance_date IS NOT NULL`;
        const totalReceivedResult = await pool.query(totalReceivedQuery, [
          machineIds,
        ]);
        billReceived = totalReceivedResult.rows[0].total_received || 0;
      }

      machines = machines.map((machine) => ({
        ...machine,
        payments: payments.filter(
          (payment) => payment.machine_id === machine.id,
        ),
      }));

      const billTotal = machines.reduce(
        (sum, machine) => sum + (Number(machine.price) || 0),
        0,
      );

      if (partsIds.length > 0) {
        const paymentsQuery = `SELECT * FROM customer_parts_karachi WHERE part_id = ANY($1)`;
        const paymentsResult = await pool.query(paymentsQuery, [partsIds]);
        payments = paymentsResult.rows;
      }

      parts = parts.map((part) => ({
        ...part,
        payments: payments.filter((payment) => payment.part_id === part.id),
      }));

      customer.machines = machines;
      customer.bill_received = parseFloat(`${billReceived}`);
      customer.bill_total = parseFloat(billTotal);
      customer.profile_completion = overallCompletion;
      customer.missing_fields = missingFields;
      customer.parts = parts;

      return NextResponse.json(
        {
          customer,
        },
        { status: 200 },
      );
    }
  } catch (error: any) {
    console.error("Error fetching data: ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
