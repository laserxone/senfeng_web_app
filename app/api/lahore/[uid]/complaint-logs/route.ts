import pool from "@/config/db";
import { sendNotificationToComplaintManagers } from "@/lib/sendNotificationToComplaintManagers";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import UploadImageForMobile from "@/lib/uploadImageForMobile";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";
import { NOTIFICATION_TYPES } from "@/constants/notifications";

export async function POST(req: NextRequest) {
  const { image_base64, ...data } = await req.json();

  try {
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No data provided for insertion" },
        { status: 400 },
      );
    }

    if (data.signature) {
      const customerId = data.image.split("/")[0];
      const fileName = `lahore/${customerId}/complaint/signature/${moment().valueOf().toString()}.png`;
      UploadImageForMobile(data.signature, fileName);
      data.signature = fileName;
    }

    if (image_base64) {
      UploadImageForMobile(image_base64, data.image);
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
    INSERT INTO complaint_logs (${fields.join(", ")})
    VALUES (${placeholders})
    RETURNING *
`;

    const result = await pool.query(query, values);

    sendNotificationToOwner(
      `Complaint updates`,
      `complaint?c=${result.rows?.[0].complaint_id}&start=${moment().startOf("month").toDate().toISOString()}&end=${moment().endOf("month").toDate().toISOString()}`,
      "lahore",
      NOTIFICATION_TYPES.complaint_updated.category,
      NOTIFICATION_TYPES.complaint_updated.title,
    );

    sendNotificationToComplaintManagers(
      `Complaint updates`,
      `complaint?c=${result.rows?.[0].complaint_id}&start=${moment().startOf("month").toDate().toISOString()}&end=${moment().endOf("month").toDate().toISOString()}`,
      "lahore",
      NOTIFICATION_TYPES.complaint_updated.category,
      NOTIFICATION_TYPES.complaint_updated.title,
    );

    return NextResponse.json({ message: "Data inserted" }, { status: 200 });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { message: error.message || "Error occured" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields: string[] = [];
    const values = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `
            UPDATE complaint_logs 
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
        `;

    await pool.query(query, values);

    return NextResponse.json(
      { message: "Updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating inventory data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
