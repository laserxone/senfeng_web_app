import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userid: string }> },
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT 
        c.*,
        u1.id AS participant_1_id, u1.name AS participant_1_name,
        u2.id AS participant_2_id, u2.name AS participant_2_name
      FROM conversations c
      LEFT JOIN users u1 ON c.participant_1 = u1.id
      LEFT JOIN users u2 ON c.participant_2 = u2.id
      WHERE c.participant_1 = $1 OR c.participant_2 = $1
      ORDER BY c.last_updated DESC`,
      [userId],
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) AS unread_count
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
       AND m.sender_id != $1
       AND m.is_read = false`,
      [userId],
    );

    const unreadCount = parseInt(countRes.rows[0].unread_count, 10);

    const conversations = result.rows.map((row) => ({
      id: row.id,
      last_message: row.last_message,
      last_updated: row.last_updated,
      participant_1: row.participant_1_id,
      participant_2: row.participant_2_id,
      participant_1_info: {
        id: row.participant_1_id,
        name: row.participant_1_name,
      },
      participant_2_info: {
        id: row.participant_2_id,
        name: row.participant_2_name,
      },
      unreadCount,
    }));

    return NextResponse.json(conversations, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { user1, user2 } = await req.json();

    const { uid } = await params;

    if (!user1 || !user2) {
      return NextResponse.json({ error: "Missing user ids" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT * FROM conversations 
       WHERE (participant_1 = $1 AND participant_2 = $2) 
          OR (participant_1 = $2 AND participant_2 = $1)`,
      [user1, user2],
    );

    if (existing.rows.length > 0) {
      const conversation = existing.rows[0];
      const otherUserId =
        Number(conversation.participant_1) === Number(uid)
          ? conversation.participant_2
          : conversation.participant_1;

      const userResult = await pool.query(
        `SELECT id, name, dp FROM users WHERE id = $1`,
        [otherUserId],
      );

      const otherUser = userResult.rows[0];
      return NextResponse.json(
        { ...existing.rows[0], otherUser },
        { status: 200 },
      );
    }

    const result = await pool.query(
      `INSERT INTO conversations (participant_1, participant_2) 
       VALUES ($1, $2) RETURNING *`,
      [user1, user2],
    );

    const conversation = result.rows[0];

    const otherUserId =
      Number(conversation.participant_1) === Number(uid)
        ? conversation.participant_2
        : conversation.participant_1;

    const userResult = await pool.query(
      `SELECT id, name, dp FROM users WHERE id = $1`,
      [Number(otherUserId)],
    );

    const otherUser = userResult.rows[0];

    return NextResponse.json(
      {
        ...conversation.id,
        otherUser,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const revalidate = 0;
