import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

// export async function POST(req:NextRequest, { params }:{params:Promise<{uid:string}>}) {
//   const { from, vehicle_no, driver_name, manager, received_by, items } =
//     await req.json();
//   const { uid } = await params;

//   try {
//     //check quantity
//     if (items && items.length > 0) {
//       for (const item of items) {
//         if (item.inventory_id) {
//           const available = await pool.query(
//             `SELECT qty, name FROM inventory WHERE id = $1`,
//             [item.inventory_id],
//           );
//           const availableQty = available.rows[0];
//           if (Number(item.qty) > Number(availableQty.qty)) {
//             return NextResponse.json(
//               {
//                 newQty: Number(availableQty.qty),
//                 inventory_id: item.inventory_id,
//                 message: `Quantity exceeded for ${availableQty.name}! Try again`,
//               },
//               { status: 200 },
//             );
//           }
//         }
//       }
//     }

//     // Insert gatepass
//     const gatepassid = await pool.query(
//       `INSERT INTO outward_gatepass (from_by, vehicle_no, driver_name, manager, received_by, user_id, items)
//        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
//       [
//         from,
//         vehicle_no,
//         driver_name,
//         manager,
//         received_by,
//         uid,
//         JSON.stringify(items),
//       ],
//     );

//     // Update inventory
//     if (items && items.length > 0) {
//       for (const item of items) {
//         if (item.inventory_id) {
//           await pool.query(
//             `UPDATE inventory SET qty = qty - $1 WHERE id = $2`,
//             [item.qty, item.inventory_id],
//           );
//         }
//       }
//     }

//     return NextResponse.json({ id: gatepassid.rows[0].id }, { status: 200 });
//   } catch (error:any) {
//     return NextResponse.json(
//       { message: error?.message || "Error saving data" },
//       { status: 500 },
//     );
//   }
// }


export async function POST(req:NextRequest) {

    try {
        const data = await req.json()
        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
        INSERT INTO outward_gatepass_karachi (${fields.join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;

        const result = await pool.query(query, values);

        const id = result.rows?.[0]?.id
        const created_at = result.rows?.[0]?.created_at
        

        return NextResponse.json({
             id,
             created_at
        }, { status: 200 });

    } catch (error:any) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error?.message || 'Error adding payment' }, { status: 500 })
    }
}


export async function GET() {

  try {
    const res = await pool.query(`
      SELECT 
        s.*,
        row_to_json(o) AS outward_gatepass
      FROM savedinvoices_karachi s
      LEFT JOIN outward_gatepass_karachi o
        ON o.savedinvoice_id = s.id
    `);
    return NextResponse.json(res.rows)
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
  }
}
