import pool from "@/config/db";
import { addLog } from "@/lib/addLog";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { generateLog } from "@/lib/generateLog";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToCRM, sendNotificationToCRMWithoutLead } from "@/lib/sendNotificationToCRM";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { NextResponse } from "next/server"


export async function POST(req, { params }) {

    const { uid } = await params

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO customer (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;




        const result = await pool.query(query, values);



        if (result.rows[0].lead) {
            sendNotificationToCRM(result.rows[0].lead, `${result.rows[0]?.name}-${result.rows[0]?.owner}`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`)
        }

        if (result.rows[0]?.lead !== result.rows[0].created_by) {
            sendNotificationToCRMWithoutLead(`${result.rows[0]?.name}-${result.rows[0]?.owner}`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`)
        }

        if (result.rows[0].ownership) {
            sendNotification(`${result.rows[0]?.name}-${result.rows[0]?.owner} assigned to you`, `${result.rows[0].member ? "member" : "customer"}/${result.rows[0].id}`, result.rows[0].ownership)
            sendNotificationToMobile(`${result.rows[0]?.name}-${result.rows[0]?.owner} assigned to you`, "Customer", result.rows[0].ownership, result.rows[0], "client", `/dashboard/customer/${result.rows[0].id}`)
        }

        try {
            const logMSG = generateLog(data, "New customer added")

            addLog({ text: logMSG, user_id: uid, customer_id: result.rows[0].id })

        } catch (error) {
            console.log(error)
        }



        return NextResponse.json({ message: "Inserted successfully", data: result.rows[0] }, { status: 201 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


export async function GET(req, { params }) {

    const { uid } = await params



    const searchParams = req.nextUrl.searchParams
    const urlQuery = searchParams.get('withoutsale')
    const mapQuery = searchParams.get('map')
    const machinesQuery = searchParams.get('machines')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get("user")
    const member = searchParams.get("member")
    const office = searchParams.get("office")
    const mycustomer = searchParams.get('mycustomer')

    try {
        const isAdmin = await checkSuperadmin(uid)

        if (isAdmin) {
            if (mapQuery) {
                let query = `
    SELECT 
        customer.id, 
        customer.name,
        customer.owner, 
        customer.location,
        customer.office,
        customer.ownership,
        users.name AS ownership_name
    FROM customer
    LEFT JOIN users ON customer.ownership = users.id
`

                if (office) {
                    query += ` WHERE customer.office = '${office}'`
                }

                query += " ORDER BY customer.name ASC"

                const result = await pool.query(query)
                return NextResponse.json(result.rows, { status: 200 });

            }
            else if (urlQuery) {
                const result = await pool.query(`
                SELECT 
                customer.*, 
                users.name AS ownership_name
                FROM customer
                LEFT JOIN users ON customer.ownership = users.id
                ORDER BY customer.name ASC;
                `)
                return NextResponse.json(result.rows, { status: 200 });
            }
            else if (machinesQuery) {
                const queryParams = []
                let query = `
                SELECT 
                c.id,
                c.name,
                c.owner,
                c.ownership,
                c.number,
                c.industry,
                c.location,
                c.customer_group,
                c.created_at, 
                c.member,
                COALESCE(u.name, '') AS ownership_name,
                COALESCE(json_agg(s.serial_no) FILTER (WHERE s.serial_no IS NOT NULL), '[]') AS machines
                FROM customer c
                LEFT JOIN sale s ON c.id = s.customer_id
                LEFT JOIN users u ON c.ownership = u.id
      `;
                if (member) {
                    query += ` WHERE c.member IS TRUE`
                } else {
                    query += ` WHERE c.member IS FALSE`
                }


                if (start_date && end_date) {
                    query += ` AND s.contract_date BETWEEN $1 AND $2`
                    queryParams.push(start_date, end_date)
                }

                if (user) {
                    query += ` AND c.ownership = $3`
                    queryParams.push(user)
                }

                query += ` GROUP BY c.id, u.name`

                let result
                if (queryParams.length > 0) {
                    result = await pool.query(query, queryParams);
                } else {
                    result = await pool.query(query)
                }

                return NextResponse.json(result.rows, { status: 200 })
            }
            else {
                const customerQuery = await pool.query(`
                SELECT 
                customer.*, 
                users.name AS ownership_name
                FROM customer
                LEFT JOIN users ON customer.ownership = users.id
                ORDER BY customer.name ASC;
                `);
                const customers = customerQuery.rows;

                if (customers.length === 0) {
                    return NextResponse.json([], { status: 200 });
                }

                const customerIds = customers.map((customer) => customer.id);

                const salesQuery = await pool.query(
                    `SELECT * FROM sale WHERE customer_id = ANY($1)`,
                    [customerIds]
                );
                const sales = salesQuery.rows;

                const customersWithSales = customers.map((customer) => ({
                    ...customer,
                    sales: sales.filter((sale) => sale.customer_id === customer.id),
                }));

                return NextResponse.json(customersWithSales, { status: 200 });
            }
        } else {



            const userQuery = await pool.query(
                `SELECT id, designation, limited_access FROM users WHERE id = $1`,
                [uid]
            );
            const user = userQuery.rows[0];

            let query = "";
            const queryParams = [];

            query = `
    SELECT 
      c.id,
      c.name,
      c.owner,
      c.ownership,
      c.number,
      c.industry,
      c.location,
      c.customer_group,
      c.created_at,
      c.lead,
      c.member,
      COALESCE(u.name, '') AS ownership_name
      ${machinesQuery ? `,
      COALESCE(json_agg(s.serial_no) FILTER (WHERE s.serial_no IS NOT NULL), '[]') AS machines` : ''}
    FROM customer c
    LEFT JOIN users u ON c.ownership = u.id
    ${machinesQuery ? 'LEFT JOIN sale s ON c.id = s.customer_id' : ''}
  `;

            let whereClauses = [];

            if (user.limited_access) {
                if (
                    user.designation === 'Social Media Manager' ||
                    user.designation === 'Customer Relationship Manager'
                ) {
                    whereClauses.push(`c.lead = $${queryParams.length + 1}`);
                    queryParams.push(uid);
                } else if (user.designation === 'Sales') {
                    whereClauses.push(`c.ownership = $${queryParams.length + 1}`);
                    queryParams.push(uid);
                }
            } else if (mycustomer) {
                whereClauses.push(`c.lead = $${queryParams.length + 1}`);
                queryParams.push(uid);
            }
            if (user.designation === 'Dealer') {
                whereClauses.push(`c.ownership = $${queryParams.length + 1}`);
                queryParams.push(uid);
            }

            if (member && member === 'true') {
                whereClauses.push("c.member IS TRUE");
            } else if (member && member === 'false') {
                whereClauses.push("c.member IS FALSE");
            }

            if (machinesQuery && start_date && end_date) {
                whereClauses.push(`s.contract_date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
                queryParams.push(start_date, end_date);
            }

            if (whereClauses.length > 0) {
                query += " WHERE " + whereClauses.join(" AND ");
            }

            query += `
    GROUP BY c.id, u.name
    ORDER BY c.name ASC
  `;


            const result = await pool.query(query, queryParams);
            return NextResponse.json(result.rows, { status: 200 });

        }



    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0

