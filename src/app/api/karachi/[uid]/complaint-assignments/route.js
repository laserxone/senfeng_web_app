import {karachi_pool as pool} from "@/config/db";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { NextResponse } from "next/server";


export async function GET() {

    try {
     const result = await pool.query(`
  SELECT 
    c.*,
    cu.name AS customer_name,
    cu.address AS customer_address,
    cu.location AS customer_location,
    cu.owner AS customer_owner,
    cu.number AS customer_number,
     cu.pin AS customer_pin,
    cu.ownership AS customer_ownership_id,
    owner_user.name AS customer_ownership_name,
    ca.id AS assignment_id,
    ca.engineer_id,
    engineer.name AS engineer_name,
    ca.assigned_by,
    assigned_by_user.name AS assigned_by_name,
    ca.created_at AS assignment_created_at
  FROM complaints c
  LEFT JOIN customer cu ON c.customer_id = cu.id
  LEFT JOIN users owner_user ON cu.ownership = owner_user.id
  LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id
  LEFT JOIN users engineer ON ca.engineer_id = engineer.id
  LEFT JOIN users assigned_by_user ON ca.assigned_by = assigned_by_user.id
  ORDER BY c.created_at DESC
`);


        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error.message || "Error occured" }, { status: 500 })
    }
}

export async function POST(req) {
    const data = await req.json()

    try {

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
    INSERT INTO complaint_assignments (${fields.join(", ")})
    VALUES (${placeholders})
`;

        await pool.query(query, values);

        await pool.query(`UPDATE complaints SET status = 'assigned' WHERE id = $1`, [data.complaint_id]);

        sendNotificationToMobile("New Complaint", `Complaint assigned to you`, data.engineer_id, data, "complaint", `/dashboard/complaint/${data.complaint_id}`)

        return NextResponse.json({message : "Data inserted"}, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: error.message || "Error occured" }, { status: 500 });
    }

}

export async function PUT(req) {
    try {
        const data = await req.json();
        const { id, ...updates } = data;

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
            UPDATE complaints 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

        await pool.query(query, values);


        return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating inventory data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0