import pool from "@/config/db"; 0
import { NextResponse } from "next/server"
import { profileFields, saleFields } from "@/constants/data";



export async function GET(req, { params }) {

  const { id } = await params

  const searchParams = req.nextUrl.searchParams
  const lead = searchParams.get('lead')

  try {

    if (lead) {

      const result = await pool.query(
        `
        SELECT 
  commissions.*, 
  u1.name AS user_name,
  u2.name AS lead_name,
  customer.id AS customer_id,
  customer.name AS customer_name,
  customer.owner AS customer_owner
FROM 
  commissions
LEFT JOIN users u1 ON commissions.user_id = u1.id
LEFT JOIN users u2 ON commissions.lead_id = u2.id
LEFT JOIN sale ON commissions.sale_id = sale.id
LEFT JOIN customer ON sale.customer_id = customer.id
WHERE 
  commissions.lead_id = $1
ORDER BY 
  commissions.created_at DESC
`,
        [id]
      );



      return NextResponse.json(result.rows, { status: 200 });

    } else {
      const salesResult = await pool.query(
        'SELECT * FROM sale WHERE sell_by = $1',
        [id]
      );
      const sales = salesResult.rows;

      const enrichedSales = await Promise.all(
        sales.map(async (sale) => {

          let machineFilled = 0;


          const hasContractImages =
            (Array.isArray(sale.contract_images_pdf) && sale.contract_images_pdf.length > 0) ||
            (Array.isArray(sale.contract_images_png) && sale.contract_images_png.length > 0);

          if (hasContractImages) machineFilled++;


          saleFields.forEach(field => {
            const value = sale[field];
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

          const customerResult = await pool.query(
            'SELECT * FROM customer WHERE id = $1',
            [sale.customer_id]
          );
          const customer = customerResult.rows[0] || {};

          const customerTotalFields = profileFields.length;

          let filledCount = 0;
          profileFields.forEach(field => {
            const value = customer[field];
            const isFilled =
              field === 'rating'
                ? typeof value === 'number' && value > 0
                : Array.isArray(value)
                  ? value.length > 0
                  : typeof value === 'number'
                    ? true
                    : typeof value === 'string'
                      ? value.trim() !== '' && value !== 'null'
                      : value !== null && value !== undefined;
            if (isFilled) filledCount++;
          });

          const paymentResult = await pool.query(
            'SELECT * FROM payment WHERE machine_id = $1',
            [sale.id]
          );
          const payments = (paymentResult.rows || []).filter(
            (payment) => payment.clearance_date !== null && payment.status === 'approved'
          );

          const paid_amount = payments.reduce((sum, payment) => {
            return sum + Number(payment.amount || 0);
          }, 0);

          const commissionResult = await pool.query(
            'SELECT * FROM commissions WHERE sale_id = $1',
            [sale.id]
          );
          const commission = commissionResult.rows[0] || {};

          const firstSaleResult = await pool.query(
            `SELECT id FROM sale WHERE customer_id = $1 AND contract_date IS NOT NULL ORDER BY contract_date ASC LIMIT 1`,
            [sale.customer_id]
          );
          const firstMachineId = firstSaleResult.rows[0]?.id;

          customer.profile_completion = Math.round((filledCount / customerTotalFields) * 100);

          return {
            ...sale,
            customer,
            payments,
            created_amount: Number(sale.price || 0),
            paid_amount,
            balance: Number(sale.price || 0) - paid_amount,
            commission,
            percentage_completion: Math.round((machineFilled / totalFields) * 100),
            first_machine: sale.id === firstMachineId,
          };
        })
      );

      return NextResponse.json(enrichedSales, { status: 200 });
    }



  } catch (error) {
    console.error('Error fetching data: ', error);
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }


}

export async function POST(req) {

    try {
        const data = await req.json();

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO commissions (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        await pool.query(query, values);

        // Step 2: Get applicant user info
        const userResult = await pool.query("SELECT name FROM users WHERE id = $1", [data.user_id]);
        const userName = userResult.rows[0]?.name || "Someone";

        // Step 3: Get all owners
        const ownersResult = await pool.query(
            "SELECT id FROM users WHERE designation = 'Owner'"
        );
        const ownerIds = ownersResult.rows.map((owner) => owner.id);

        // Step 4: Add notifications to Firestore
        const timestamp = moment().valueOf();

        const notifications = ownerIds.map((eachId) => ({
            TimeStamp: timestamp,
            page: "commission",
            read: false,
            title: `${userName} applied for commission`,
            sendTo: eachId,
        }));

        const db = admin.firestore();
        const batch = db.batch();

        notifications.forEach((notification) => {
            const docRef = db.collection("Notification").doc();
            batch.set(docRef, notification);
        });

        await batch.commit();


        return NextResponse.json({
            message: "Data added successfully",
        }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding Data' }, { status: 500 })
    }
}

export const revalidate = 0