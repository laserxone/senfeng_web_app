import {karachi_pool as pool} from "@/config/db";
import { saleFields } from "@/constants/data";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

    const { id, uid } = await params;

    try {

        const isAdmin = await checkSuperadmin(uid)
        if (isAdmin) {
            const customerQuery = `
              SELECT c.lead, c.ownership, u.name AS ownership_name, l.name AS lead_name
              FROM customer c
              LEFT JOIN users u ON c.ownership = u.id
              LEFT JOIN users l ON c.lead = l.id
              WHERE c.id = $1
          `;
            const customerResult = await pool.query(customerQuery, [id]);

            if (customerResult.rows.length === 0) {
                return NextResponse.json({ message: "Customer not found" }, { status: 404 });
            }

            const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 ORDER BY contract_date ASC`;
            const machinesResult = await pool.query(machinesQuery, [id]);
            let machines = machinesResult.rows;

            let saleFilledCount = 0;

            const machineIds = machines.map((m) => m.id);

            let orderItemsMap = new Map();

            if (machineIds.length > 0) {
                const orderItemsResult = await pool.query(
                    `SELECT machine_id, status FROM order_items WHERE machine_id = ANY($1::int[])`,
                    [machineIds]
                );

                orderItemsResult.rows.forEach((row) => {
                    orderItemsMap.set(row.machine_id, row.status);
                });
            }

            machines = machines.map(machine => {
                let machineFilled = 0;

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

                    if (isFilled) machineFilled++;
                });

                const totalFields = saleFields.length + 1;

                saleFilledCount += machineFilled;

                return {
                    ...machine,
                    percentage_completion: Math.round((machineFilled / totalFields) * 100),
                    status: orderItemsMap.get(machine.id) || null,
                };
            });




            return NextResponse.json(
                machines
                , { status: 200 });

        } else {
            const customerQuery = `
              SELECT c.lead, c.ownership, u.name AS ownership_name, l.name AS lead_name
              FROM customer c
              LEFT JOIN users u ON c.ownership = u.id
              LEFT JOIN users l ON c.lead = l.id
              WHERE c.id = $1
          `;
            const customerResult = await pool.query(customerQuery, [id]);

            if (customerResult.rows.length === 0) {
                return NextResponse.json({ message: "Customer not found" }, { status: 404 });
            }

            const customer = customerResult.rows[0];

            const userQuery = await pool.query(`SELECT id, designation, limited_access FROM users WHERE id = $1`, [uid])

            const user = userQuery.rows[0]

            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 500 })
            }

            if (user.limited_access) {
                if (user.designation === 'Social Media Manager' || user.designation === 'Customer Relationship Manager') {
                    if (user.id !== customer.lead) {
                        return NextResponse.json({ message: "You don't have access to this page" }, { status: 500 })
                    }
                }

                if (user.designation === 'Sales') {
                    if (user.id !== customer.ownership) {
                        return NextResponse.json({ message: "You don't have access to this page" }, { status: 500 })
                    }
                }
            }

            const machinesQuery = `SELECT * FROM sale WHERE customer_id = $1 ORDER BY contract_date ASC`;
            const machinesResult = await pool.query(machinesQuery, [id]);
            let machines = machinesResult.rows;

            let saleFilledCount = 0;

            const machineIds = machines.map((m) => m.id);

            let orderItemsMap = new Map();

            if (machineIds.length > 0) {
                const orderItemsResult = await pool.query(
                    `SELECT machine_id, status FROM order_items WHERE machine_id = ANY($1::int[])`,
                    [machineIds]
                );

                orderItemsResult.rows.forEach((row) => {
                    orderItemsMap.set(row.machine_id, row.status);
                });
            }

            machines = machines.map(machine => {
                let machineFilled = 0;

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

                    if (isFilled) machineFilled++;
                });

                const totalFields = saleFields.length + 1;

                saleFilledCount += machineFilled;

                return {
                    ...machine,
                    percentage_completion: Math.round((machineFilled / totalFields) * 100),
                    status: orderItemsMap.get(machine.id) || null,
                };
            });




            return NextResponse.json(
                machines
                , { status: 200 });

        }



    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 });
    }
}

export const revalidate = 0