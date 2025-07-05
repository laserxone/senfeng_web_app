import pool from "@/config/db";
import moment from "moment";
import { NextResponse } from "next/server";
import { storage } from "@/config/firebase";
import { ref, uploadString } from "firebase/storage";




export async function POST(req) {
    const data = await req.json()

    try {

        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "No data provided for insertion" }, { status: 400 });
        }

        if (data.signature) {
            const customerId = data.image.split('/')[0];
            const fileName = `${customerId}/complaint/signature/${moment().valueOf().toString()}.png`;
            await UploadImageForMobile(data.signature, fileName);
            data.signature = fileName;
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
    INSERT INTO complaint_logs (${fields.join(", ")})
    VALUES (${placeholders})
`;

        await pool.query(query, values);

        return NextResponse.json({ message: "Data inserted" }, { status: 200 });
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
            UPDATE complaint_logs 
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

async function UploadImageForMobile(image, fileName) {
    const base64 = image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    return new Promise(async (resolve, reject) => {
        try {

            const storageRef = ref(storage, fileName);

            await uploadString(storageRef, base64, "base64", { contentType: "image/png" });
            resolve(true);
        } catch (error) {
            console.log(error)
            reject(null)
        }

    })

}

export const revalidate = 0