import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await pool.connect();
  try {
    const {
      rows: [application],
    } = await client.query(
      "SELECT image FROM gift_applications WHERE id = $1",
      [id],
    );
    if (!application)
      return NextResponse.json({ message: "Data not found" }, { status: 404 });
    if (application.image)
      try {
        await admin.storage().bucket().file(application.image).delete();
      } catch (error) {
        console.error("Failed to delete gift image", error);
      }
    await client.query("BEGIN");
    await client.query("DELETE FROM gift_applications WHERE id = $1", [id]);
    await client.query("COMMIT");
    return NextResponse.json({ message: "Gift application deleted" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
