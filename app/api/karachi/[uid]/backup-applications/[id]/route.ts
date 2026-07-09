import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string; id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { message: "Id is missing" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    const updates = {
      ...body,
      actual_return_date: body.actual_return_date || body.return_date,
    };

    delete updates.return_date;

    const allowedFields = [
      "issue_date",
      "actual_return_date",
      "issued",
      "status",
      "backup_inventory_id",
      "expected_return_date",
    ];

    const fields: string[] = [];
    const values: unknown[] = [];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        values.push(updates[field]);
        fields.push(`${field} = $${values.length}`);
      }
    });

    if (!fields.length) {
      return NextResponse.json(
        { message: "No valid data provided for update" },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await pool.query(
      `
      UPDATE backup_applications
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { message: "Data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string; id: string }> }
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
      `
      SELECT image
      FROM backup_applications
      WHERE id = $1
      `,
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

    if (data.image) {
      try {
        await bucket.file(data.image).delete();
      } catch (error) {
        console.error(`Failed to delete ${data.image}:`, error);
      }
    }

    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM backup_applications
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Backup application deleted" },
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
