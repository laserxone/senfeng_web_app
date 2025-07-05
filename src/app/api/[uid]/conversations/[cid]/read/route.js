import pool from "@/config/db";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const { cid: conversationId } = await params;
  const { userId } = await req.json();

  try {
    await pool.query(
      `
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = $1
        AND sender_id = $2
        AND is_read = false
      `,
      [conversationId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const revalidate = 0