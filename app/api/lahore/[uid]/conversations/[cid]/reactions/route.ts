import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> },
) {
  const { cid } = await params;
  const { messageId, userId, emoji } = await req.json();

  if (!messageId || !userId || !String(emoji || "").trim()) {
    return NextResponse.json(
      { error: "Message, user, and emoji are required" },
      { status: 400 },
    );
  }

  const message = await pool.query(
    `SELECT id FROM messages WHERE id = $1 AND conversation_id = $2`,
    [messageId, cid],
  );
  if (!message.rowCount) {
    return NextResponse.json(
      { error: "Message was not found" },
      { status: 404 },
    );
  }

  const result = await pool.query(
    `INSERT INTO message_reactions (message_id, user_id, emoji)
     VALUES ($1, $2, $3)
     ON CONFLICT (message_id, user_id, emoji) DO NOTHING
     RETURNING id`,
    [messageId, userId, String(emoji).trim()],
  );
  return NextResponse.json({ success: true, added: result.rowCount > 0 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> },
) {
  const { cid } = await params;
  const { messageId, userId, emoji } = await req.json();
  const result = await pool.query(
    `DELETE FROM message_reactions r USING messages m
     WHERE r.message_id = m.id AND m.conversation_id = $1
       AND r.message_id = $2 AND r.user_id = $3 AND r.emoji = $4`,
    [cid, messageId, userId, String(emoji || "").trim()],
  );
  return NextResponse.json({ success: true, removed: result.rowCount > 0 });
}

export const revalidate = 0;
