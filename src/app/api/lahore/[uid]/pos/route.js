import pool from "@/config/db";
import moment from "moment";
import { NextResponse } from "next/server";

export async function GET(req) {
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
        "SELECT * FROM inventory ORDER BY id ASC",
      );

      const query = `
  SELECT
    si.*,
    COALESCE(SUM(cp.amount::numeric), 0) AS total_paid
  FROM savedinvoices si
  LEFT JOIN customer_parts cp ON cp.part_id = si.id
  GROUP BY si.id
`;
      const resultQry = await pool.query(query);

      const invoices = resultQry.rows.map((invoice) => {
        const itemsTotal = Array.isArray(invoice.fields)
          ? invoice.fields.reduce((sum, item) => {
              const val = Number(item?.total ?? 0);
              return sum + (isNaN(val) ? 0 : val);
            }, 0)
          : 0;
        const discount = Number(invoice.discount ?? 0);
        const finalAmount = itemsTotal - discount;
        const totalPaid = Number(invoice.total_paid ?? 0);
        let status = "NA";
        if (totalPaid === 0) status = "Pending";
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
        { stock: result.rows, reminders: invoices.filter((item)=> item?.status !== 'Paid') },
        { status: 200 },
      );
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

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

export async function PUT(req) {
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
    } = await req.json();

    let returning_id = null;

    let generatedInvoiceNumber = "";

    if (selecteduser?.id) {
      await pool.query(
        `INSERT INTO issueditems 
            (name, company, phone, address, manager, fields, user_id, issued) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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
        "SELECT MAX(id) AS last_id FROM savedinvoices",
      );
      const invoicenumber = Number(lastIdResult.rows[0]?.last_id || 0) + 1;
      generatedInvoiceNumber = `${moment().format("YYYYMMDD")}-${invoicenumber}`;
      const result = await pool.query(
        `INSERT INTO savedinvoices 
            (name, company, phone, address, manager, invoicenumber, fields, payment, customer_id, discount) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        ],
      );
      returning_id = result.rows[0].id;
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        const { id, qty } = entry;
        await pool.query("UPDATE inventory SET qty = $1 WHERE id = $2", [
          qty,
          id,
        ]);
      }
    }

    const result = await pool.query(
      "SELECT id FROM poscustomer WHERE phone = $1 LIMIT 1",
      [phone],
    );
    if (result.rows.length > 0) {
      await pool.query(
        "UPDATE poscustomer SET name = $1, customer = $2, phone = $3, address = $4 WHERE id = $5",
        [name, company, phone, address, result.rows[0].id],
      );
    } else {
      await pool.query(
        `INSERT INTO poscustomer 
                (name, customer, phone, address) 
                VALUES ($1, $2, $3, $4)`,
        [name, company, phone, address],
      );
    }

    return NextResponse.json(
      { nextinvoice: generatedInvoiceNumber, returning_id },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Processing error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
