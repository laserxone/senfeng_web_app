import pool from "@/config/db";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const createPosHandlers = (office: "lahore" | "karachi") => {
  async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const availablemachine = searchParams.get("availablemachine");

    try {
      if (availablemachine) {
        const result = await pool.query(
          "SELECT * FROM order_items WHERE status = 'Order Placed' AND is_machine = TRUE ORDER BY id ASC",
        );

        return NextResponse.json(result.rows, { status: 200 });
      } else {
        const result = await pool.query(
          `SELECT * FROM inventory WHERE LOWER(office) = '${office}' ORDER BY id ASC`,
        );

        const query = `
    SELECT
      si.*,
      COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
    FROM savedinvoices si
    LEFT JOIN customer_parts cp ON cp.part_id = si.id AND cp.office = si.office
    WHERE si.office = '${office}' AND si.owner_paid IS FALSE
      AND si.invoice_status = 'issued'
    GROUP BY si.id
  `;
        const resultQry = await pool.query(query);
        const proformaResult = await pool.query(`
          SELECT *
          FROM savedinvoices
          WHERE office = '${office}' AND invoice_status = 'proforma'
          ORDER BY created_at DESC
        `);

        const invoices = resultQry.rows.map((invoice) => {
          const itemsTotal = Array.isArray(invoice.fields)
            ? invoice.fields.reduce((sum: any, item: any) => {
                const val = Number(item?.total ?? 0);
                return sum + (isNaN(val) ? 0 : val);
              }, 0)
            : 0;
          const discount = Number(invoice.discount ?? 0);
          const finalAmount = itemsTotal - discount;
          const totalPaid = Number(invoice.total_paid ?? 0);
          let status = "NA";
          if (itemsTotal === 0) status = "Paid";
          else if (totalPaid === 0) status = "Pending";
          else if (finalAmount - totalPaid !== 0) status = "Partial";
          else status = "Paid";
          return {
            ...invoice,
            items_total: itemsTotal,
            discount,
            final_amount: finalAmount,
            status,
          };
        });

        return NextResponse.json(
          {
            stock: result.rows,
            reminders: invoices
              .filter(
                (item) =>
                  moment(item.created_at).isSameOrAfter("2025-12-01") ||
                  item.payment === false,
              )
              .filter((item) => item?.status !== "Paid"),
            pi: proformaResult.rows,
          },
          { status: 200 },
        );
      }
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Processing error" },
        { status: 500 },
      );
    }
  }

  async function POST(req: NextRequest) {
    try {
      const data = await req.json();

      if (!data || Object.keys(data).length === 0) {
        return NextResponse.json(
          { message: "No data provided for insertion" },
          { status: 400 },
        );
      }

      delete data.office_id;
      data.office = office;
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

      const query = `
          INSERT INTO inventory (${fields.join(", ")})
          VALUES (${placeholders})
          RETURNING *
      `;

      await pool.query(query, values);

      console.log("data inserted successfully");
      return NextResponse.json(
        {
          message: "Data added successfully",
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error inserting data: ", error);
      return NextResponse.json(
        { message: "Error adding customer" },
        { status: 500 },
      );
    }
  }

  async function PUT(req: NextRequest) {
    try {
      const {
        entries,
        name,
        company,
        phone,
        address,
        manager,
        fields,
        payment,
        selecteduser,
        customer_id,
        discount,
        invoice_status = "issued",
      } = await req.json();

      if (customer_id) {
        const customer = await pool.query(
          `SELECT id FROM customer WHERE id = $1 AND office = '${office}'`,
          [customer_id],
        );
        if (!customer.rowCount) {
          return NextResponse.json(
            { message: "Customer does not belong to this office" },
            { status: 409 },
          );
        }
      }
      const inventoryIds = [
        ...new Set(
          [
            ...(Array.isArray(entries) ? entries : []),
            ...(Array.isArray(fields) ? fields : []),
          ]
            .map((item) => Number(item?.id))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      ];
      if (inventoryIds.length) {
        const stock = await pool.query(
          `SELECT id FROM inventory WHERE id = ANY($1::int[]) AND office = '${office}'`,
          [inventoryIds],
        );
        if (stock.rowCount !== inventoryIds.length) {
          return NextResponse.json(
            { message: "An inventory item does not belong to this office" },
            { status: 409 },
          );
        }
      }

      let returning_id = null;

      let generatedInvoiceNumber = "";

      if (selecteduser?.id) {
        await pool.query(
          `INSERT INTO issueditems
              (name, company, phone, address, manager, fields, user_id, issued, office)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '${office}')`,
          [
            name,
            company,
            phone,
            address,
            manager,
            JSON.stringify(fields),
            selecteduser.id,
            true,
          ],
        );
      } else {
        const lastIdResult = await pool.query(
          `SELECT MAX(id) AS last_id FROM savedinvoices WHERE office = '${office}'`,
        );
        const invoicenumber = Number(lastIdResult.rows[0]?.last_id || 0) + 1;
        generatedInvoiceNumber = `${moment().format("YYYYMMDD")}-${invoicenumber}`;
        const result = await pool.query(
          `INSERT INTO savedinvoices
              (name, company, phone, address, manager, invoicenumber, fields, payment, customer_id, discount, invoice_status, office)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '${office}')
              RETURNING id`,
          [
            name,
            company,
            phone,
            address,
            manager,
            generatedInvoiceNumber,
            JSON.stringify(fields),
            payment,
            customer_id,
            discount,
            invoice_status,
          ],
        );
        returning_id = result.rows[0].id;
      }

      if (entries.length > 0) {
        for (const entry of entries) {
          const { id, qty } = entry;
          await pool.query(
            `UPDATE inventory SET qty = $1 WHERE id = $2 AND office = '${office}'`,
            [qty, id],
          );
        }
      }

      return NextResponse.json(
        { nextinvoice: generatedInvoiceNumber, returning_id },
        { status: 200 },
      );
    } catch (error: any) {
      console.log(error);
      return NextResponse.json(
        { message: error?.message || "Processing error" },
        { status: 500 },
      );
    }
  }
  return { GET, POST, PUT };
};

export const { GET, POST, PUT } = createPosHandlers("lahore");

export const revalidate = 0;
