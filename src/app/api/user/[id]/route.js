import pool from "@/config/db";
import moment from 'moment-timezone';
import { NextResponse } from "next/server";
import { profileFields, saleFields } from "@/constants/data";


export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const TIMEZONE = "Asia/Karachi";
    const now = moment.tz(TIMEZONE);
    const currentMonthStart = now.clone().startOf("month").toISOString();
    const currentMonthEnd = now.clone().endOf("month").toISOString();
    const lastMonthStart = now.clone().subtract(1, "month").startOf("month").toISOString();
    const lastMonthEnd = now.clone().subtract(1, "month").endOf("month").toISOString();

    const [userResult] = await Promise.all([
      pool.query("SELECT id, dp, name, designation FROM users WHERE id = $1", [id])
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];


    if (user?.designation === 'Sales' || user?.designation === 'Social Media Manager' || user?.designation === 'Customer Relationship Manager') {

      const [customersQuery, customersWithSaleQuery] = await Promise.all([
        pool.query("SELECT * FROM customer WHERE ownership = $1", [id]),
        pool.query(`
        SELECT DISTINCT customer.* 
        FROM customer 
        INNER JOIN sale ON sale.customer_id = customer.id 
        WHERE customer.ownership = $1`, [id])
      ]);

      const customers = customersQuery.rows;
      const customersWithSale = customersWithSaleQuery.rows;
      const totalCustomers = customers.length;
      const totalCustomersWithSale = customersWithSale.length;

      const customerIds = customers.map(c => c.id);
      const saleCustomerIds = customersWithSale.map(c => c.id);

      let sales = [];
      let payments = [];

      if (customerIds.length > 0) {
        const salesQuery = await pool.query(`SELECT * FROM sale WHERE customer_id = ANY($1)`, [customerIds]);
        sales = salesQuery.rows;

        if (sales.length > 0) {
          const machineIds = sales.map(s => s.id);
          const paymentsQuery = await pool.query(`SELECT * FROM payment WHERE machine_id = ANY($1)`, [machineIds]);
          payments = paymentsQuery.rows;
        }
      }



      const machinesSoldQuery = `
      SELECT COUNT(*) AS total 
      FROM sale 
      WHERE contract_date BETWEEN $1 AND $2 AND sell_by = $3
    `;

      const [
        currentMonthSalesResult,
        lastMonthSalesResult,
        saleDetailsQueryResult,
        feedbackQueryResult,
        visitQueryResult,
        allTasksQueryResult
      ] = await Promise.all([
        pool.query(machinesSoldQuery, [currentMonthStart, currentMonthEnd, id]),
        pool.query(machinesSoldQuery, [lastMonthStart, lastMonthEnd, id]),
        pool.query(`
        SELECT 
          s.id, s.customer_id, s.contract_date, s.serial_no, s.price, 
          c.name AS customer_name, c.owner AS customer_owner 
        FROM sale s 
        LEFT JOIN customer c ON s.customer_id = c.id 
        WHERE s.contract_date BETWEEN $1 AND $2 
        AND s.sell_by = $3`, [currentMonthStart, currentMonthEnd, id]),
        saleCustomerIds.length > 0
          ? pool.query(`
            SELECT COUNT(DISTINCT customer_id) AS feedbacks_taken 
            FROM feedback 
            WHERE created_at BETWEEN $1 AND $2 
            AND user_id = $3 
            AND customer_id = ANY($4)`, [currentMonthStart, currentMonthEnd, id, saleCustomerIds])
          : { rows: [{ feedbacks_taken: 0 }] },
        pool.query(`
        SELECT COUNT(*) AS total_visits 
        FROM visit 
        WHERE created_at BETWEEN $1 AND $2 
        AND user_id = $3`, [currentMonthStart, currentMonthEnd, id]),
        pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [id])
      ]);

      const machinesSoldThisMonth = parseInt(currentMonthSalesResult.rows[0].total, 10) || 0;
      const machinesSoldLastMonth = parseInt(lastMonthSalesResult.rows[0].total, 10) || 0;
      const feedbacksTakenThisMonth = parseInt(feedbackQueryResult.rows[0].feedbacks_taken, 10) || 0;
      const totalVisits = parseInt(visitQueryResult.rows[0].total_visits, 10) || 0;
      const percentageChange =
        machinesSoldLastMonth === 0
          ? machinesSoldThisMonth > 0 ? 100 : 0
          : ((machinesSoldThisMonth - machinesSoldLastMonth) / machinesSoldLastMonth) * 100;
      const remainingFeedbacks = totalCustomersWithSale - feedbacksTakenThisMonth;

      const enrichedCustomers = customers.map((customer) => {
        const filledCount = profileFields.reduce((count, field) => {
          const value = customer[field];
          const filled =
            field === "rating"
              ? typeof value === "number" && value > 0
              : Array.isArray(value)
                ? value.length > 0
                : typeof value === "string"
                  ? value.trim() !== "" && value !== "null"
                  : value !== null && value !== undefined;
          return filled ? count + 1 : count;
        }, 0);

        const customerSales = sales
          .filter(s => s.customer_id === customer.id)
          .map(sale => {
            let machineFilled = 0;

            const hasContractImages =
              (Array.isArray(sale.contract_images_pdf) && sale.contract_images_pdf.length > 0) ||
              (Array.isArray(sale.contract_images_png) && sale.contract_images_png.length > 0);

            if (hasContractImages) machineFilled++;

            saleFields.forEach(field => {
              const value = sale[field];
              const filled =
                Array.isArray(value)
                  ? value.length > 0
                  : typeof value === "string"
                    ? value.trim() !== "" && value !== "null"
                    : typeof value === "number"
                      ? !isNaN(value)
                      : value !== null && value !== undefined;

              if (filled) machineFilled++;
            });

            const totalFields = saleFields.length + 1;
            const completion = Math.round((machineFilled / totalFields) * 100);

            return {
              ...sale,
              payments: payments.filter(p => p.machine_id === sale.id),
              percentage_completion: completion,
            };
          });

        return {
          ...customer,
          profile_completion: Math.round((filledCount / profileFields.length) * 100),
          sales: customerSales,
        };
      });



      return NextResponse.json({
        user,
        totalCustomers,
        totalCustomersWithSale,
        machinesSoldThisMonth,
        machinesSoldLastMonth,
        machinesSoldThisMonthDetail: saleDetailsQueryResult.rows,
        feedbacksTakenThisMonth,
        remainingFeedbacks,
        totalVisits,
        allTasks: allTasksQueryResult.rows.length,
        percentageChange: percentageChange.toFixed(2),
        customers: enrichedCustomers,
      });

    } else if (user?.designation === 'Customer Relationship Manager (After Sales)') {

      const customersResult = await pool.query(
        `SELECT id, name, location, number, owner, member, created_at
            FROM customer
            WHERE member IS TRUE`
      );

      const customers = customersResult.rows;

      const customersWithFeedback = [];
      const customersWithoutFeedback = [];

      for (const customer of customers) {
        const feedbackResult = await pool.query(
          `
              SELECT id, customer_id, user_id, created_at FROM feedback
              WHERE customer_id = $1
              AND user_id = $2
              AND created_at BETWEEN $3 AND $4
              ORDER BY created_at DESC
              LIMIT 1
              `,
          [customer.id, id, currentMonthStart, currentMonthEnd]
        );

        if (feedbackResult.rows.length > 0) {
          customersWithFeedback.push({ ...customer, feedback_date: feedbackResult.rows[0].created_at });
        } else {
          customersWithoutFeedback.push(customer);
        }
      }

      const allTasksQueryResult = await pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [id])

      return NextResponse.json({ user, withFeedback: customersWithFeedback, withoutFeedback: customersWithoutFeedback, allTasks: allTasksQueryResult.rows.length }, { status: 200 })

    } else {
      const allTasksQueryResult = await pool.query(`SELECT * FROM task WHERE assigned_to = $1 AND status = 'Pending'`, [id])
      return NextResponse.json({ user, allTasks: allTasksQueryResult.rows.length }, { status: 200 })
    }


  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const { ...updates } = data;
    const { id } = await params

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
          UPDATE users 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    console.log("data updated successfully");
    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const revalidate = 0;
