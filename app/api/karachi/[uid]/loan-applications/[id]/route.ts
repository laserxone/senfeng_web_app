import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { message: "Id is missing" },
            { status: 400 }
        );
    }

    const client = await pool.connect();

    try {
        const result = await client.query(
            `SELECT cheque_images, supporting_documents
       FROM loan_applications
       WHERE id = $1`,
            [id]
        );

        const data = result.rows?.[0];

        if (!data) {
            return NextResponse.json(
                { message: "Data not found" },
                { status: 404 }
            );
        }

        const bucket = admin.storage().bucket();

        const chequeImages = data.cheque_images || [];
        const supportingDocuments = data.supporting_documents || [];

        // Delete files and wait for completion
        await Promise.all([
            ...chequeImages.map(async (filePath: string) => {
                try {
                    await bucket.file(filePath).delete();
                } catch (error) {
                    console.error(`Failed to delete ${filePath}:`, error);
                }
            }),
            ...supportingDocuments.map(async (filePath: string) => {
                try {
                    await bucket.file(filePath).delete();
                } catch (error) {
                    console.error(`Failed to delete ${filePath}:`, error);
                }
            }),
        ]);

        await client.query("BEGIN");

        await client.query(
            `DELETE FROM loan_applications WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Document deleted" },
            { status: 200 }
        );
    } catch (error: any) {
        await client.query("ROLLBACK");

        return NextResponse.json(
            { message: error.message || "Internal server error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}