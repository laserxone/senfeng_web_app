import pool from "@/config/db";
import { partFields, profileFields, saleFields } from "@/constants/data";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import { NextRequest, NextResponse } from "next/server";

type Office = "karachi" | "lahore";
type RouteContext = { params: Promise<{ uid: string }> };

export const createCommissionHandlers = (office: Office) => {
  const POST = async (req: NextRequest) => {
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
      const result = await pool.query(
        `INSERT INTO commissions (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values,
      );
      const userResult = await pool.query(
        "SELECT name FROM users WHERE id = $1",
        [data.user_id],
      );
      const userName = userResult.rows[0]?.name || "Someone";
      sendNotificationToOwner(
        `${userName} applied for commission`,
        `commission?c=${result.rows?.[0]?.id}`,
        office,
        NOTIFICATION_TYPES.commission_applied.category,
        NOTIFICATION_TYPES.commission_applied.title,
      );
      return NextResponse.json(
        { message: "Data added successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error inserting data: ", error);
      return NextResponse.json(
        { message: "Error adding Data" },
        { status: 500 },
      );
    }
  };

  const GET = async (req: NextRequest, { params }: RouteContext) => {
    const { uid } = await params;
    const lead = req.nextUrl.searchParams.get("lead");
    try {
      if (await checkSuperadmin(uid)) {
        const { rows } = await pool.query(
          `
          SELECT commissions.*, users.name AS user_name, sale.serial_no AS machine_name,
            sale.speed_money AS speed_money, sale.speed_money_note AS speed_money_note,
            sale.speed_money_amount AS speed_money_amount, sale.contract_date,
            latest_payment.last_payment_date,
            CASE WHEN sale.contract_date IS NULL OR latest_payment.last_payment_date IS NULL THEN NULL
              ELSE (latest_payment.last_payment_date::date - sale.contract_date::date) + 1 END AS payment_days,
            sale.order_no_arr AS order_no_arr, sale.contract_images_png,
            sale.machine_nameplate_images, customer.id AS customer_id,
            customer.customer_group AS customer_group, customer.name AS customer_name,
            customer.owner AS customer_owner
          FROM commissions
          LEFT JOIN users ON commissions.user_id = users.id
          LEFT JOIN sale ON commissions.sale_id = sale.id
          LEFT JOIN LATERAL (
            SELECT MAX(COALESCE(payment.clearance_date, payment.transaction_date)) AS last_payment_date
            FROM payment WHERE payment.machine_id = sale.id
          ) AS latest_payment ON TRUE
          LEFT JOIN customer AS customer ON sale.customer_id = customer.id
          WHERE users.office = $1
          ORDER BY commissions.created_at DESC
        `,
          [office],
        );
        return NextResponse.json(rows, { status: 200 });
      }
      if (lead) {
        const result = await pool.query(
          `
          SELECT commissions.*, u1.name AS user_name, u2.name AS lead_name,
            customer.id AS customer_id, customer.name AS customer_name, customer.owner AS customer_owner
          FROM commissions
          LEFT JOIN users u1 ON commissions.user_id = u1.id
          LEFT JOIN users u2 ON commissions.lead_id = u2.id
          LEFT JOIN sale ON commissions.sale_id = sale.id
          LEFT JOIN customer ON sale.customer_id = customer.id
          WHERE commissions.lead_id = $1
          ORDER BY commissions.created_at DESC
        `,
          [uid],
        );
        return NextResponse.json(result.rows, { status: 200 });
      }
      const salesResult = await pool.query(
        `
        SELECT * FROM sale s WHERE s.sell_by = $1
        AND NOT EXISTS (SELECT 1 FROM cancelled_machine cm WHERE cm.machine_id = s.id)
      `,
        [uid],
      );
      const enrichedSales = await Promise.all(
        salesResult.rows.map(async (sale) => {
          const hasContractImages =
            (Array.isArray(sale.contract_images_pdf) &&
              sale.contract_images_pdf.length > 0) ||
            (Array.isArray(sale.contract_images_png) &&
              sale.contract_images_png.length > 0);
          const checkingFields =
            sale.type === "machine" ? saleFields : partFields;
          const machineFilled = checkingFields.reduce((count, field) => {
            const value = sale[field];
            const isFilled = Array.isArray(value)
              ? value.length > 0
              : typeof value === "number"
                ? field === "price"
                  ? value !== null && !isNaN(value)
                  : true
                : typeof value === "string"
                  ? value.trim() !== "" && value !== "null"
                  : value !== null && value !== undefined;
            return count + Number(isFilled);
          }, Number(hasContractImages));
          const customerResult = await pool.query(
            "SELECT * FROM customer WHERE id = $1",
            [sale.customer_id],
          );
          const customer = customerResult.rows[0] || {};
          const customerFilled = profileFields.reduce((count, field) => {
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
            return count + Number(isFilled);
          }, 0);
          const paymentResult = await pool.query(
            "SELECT * FROM payment WHERE machine_id = $1",
            [sale.id],
          );
          const payments = paymentResult.rows.filter(
            (payment) => payment.clearance_date !== null,
          );
          const paid_amount = payments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0,
          );
          const commissionResult = await pool.query(
            "SELECT * FROM commissions WHERE sale_id = $1",
            [sale.id],
          );
          const firstSaleResult = await pool.query(
            "SELECT id FROM sale WHERE customer_id = $1 AND contract_date IS NOT NULL ORDER BY contract_date ASC LIMIT 1",
            [sale.customer_id],
          );
          customer.profile_completion = Math.round(
            (customerFilled / profileFields.length) * 100,
          );
          return {
            ...sale,
            customer,
            payments,
            created_amount: Number(sale.price || 0),
            paid_amount,
            balance: Number(sale.price || 0) - paid_amount,
            commission: commissionResult.rows[0] || {},
            percentage_completion: Math.round(
              (machineFilled / (checkingFields.length + 1)) * 100,
            ),
            first_machine: sale.id === firstSaleResult.rows[0]?.id,
          };
        }),
      );
      return NextResponse.json(enrichedSales, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        {
          message: "Failed to fetch commissions",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  };

  return { GET, POST };
};

export const { GET, POST } = createCommissionHandlers("lahore");
export const revalidate = 0;
