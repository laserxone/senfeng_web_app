import pool from "@/config/db";
import { NextResponse } from "next/server"
import { profileFields, saleFields } from "@/constants/data";


export async function GET(req, { params }) {

    const { id } = await params

    try {
        const salesResult = await pool.query(
            'SELECT * FROM sale WHERE sell_by = $1',
            [id]
          );
          const sales = salesResult.rows;
          
          const enrichedSales = await Promise.all(
            sales.map(async (sale) => {

              let machineFilled = 0;
              
                    // Handle contract_images as one field
                    const hasContractImages =
                      (Array.isArray(sale.contract_images_pdf) && sale.contract_images_pdf.length > 0) ||
                      (Array.isArray(sale.contract_images_png) && sale.contract_images_png.length > 0);
              
                    if (hasContractImages) machineFilled++;
              
                    // Handle other saleFields
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
                (payment) => payment.clearance_date !== null
              );
          
              const paid_amount = payments.reduce((sum, payment) => {
                return sum + Number(payment.amount || 0);
              }, 0);
          
              const commissionResult = await pool.query(
                'SELECT * FROM commissions WHERE sale_id = $1',
                [sale.id]
              );
              const commission = commissionResult.rows[0] || {};

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
              };
            })
          );
          
          return NextResponse.json(enrichedSales, { status: 200 });
          

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}

export async function POST(req, { params }) {

    try {
        const data = await req.json();
        const { id } = await params

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO visit (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const { rows } = await pool.query(query, values);
        const newData = rows[0];
        const userQuery = `SELECT name FROM users WHERE id = $1;`;
        const userResult = await pool.query(userQuery, [id]);
        const user_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;

        return NextResponse.json({ ...newData, user_name }, { status: 200 });

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: 'Error adding customer' }, { status: 500 })
    }
}


export const revalidate = 0