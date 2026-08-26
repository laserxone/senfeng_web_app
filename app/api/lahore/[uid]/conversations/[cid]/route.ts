import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import { createLinkPreview } from "@/lib/link-preview";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { after, NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> },
) {
  const { cid } = await params;
  const { searchParams } = new URL(req.url);
  const usePagination = searchParams.has("limit");
  const requestedLimit = Number(searchParams.get("limit"));
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 30, 1),
    100,
  );
  const beforeCreatedAt = searchParams.get("beforeCreatedAt");
  const beforeId = Number(searchParams.get("beforeId"));

  const res = await pool.query(
    `SELECT m.*,
      CASE WHEN parent.id IS NULL THEN NULL ELSE json_build_object(
        'id', parent.id,
        'sender_id', parent.sender_id,
        'message', parent.message
      ) END AS reply_to,
      COALESCE((
        SELECT json_agg(json_build_object('emoji', grouped.emoji, 'userIds', grouped.user_ids))
        FROM (
          SELECT emoji, json_agg(user_id) AS user_ids
          FROM message_reactions
          WHERE message_id = m.id
          GROUP BY emoji
        ) grouped
      ), '[]'::json) AS reactions
    FROM messages m
    LEFT JOIN messages parent ON parent.id = m.reply_to_message_id
    WHERE m.conversation_id = $1
      AND ($2::timestamptz IS NULL OR (m.created_at, m.id) < ($2::timestamptz, $3::bigint))
    ORDER BY m.created_at ${usePagination ? "DESC" : "ASC"}, m.id ${usePagination ? "DESC" : "ASC"}
    ${usePagination ? "LIMIT $4" : ""}`,
    usePagination
      ? [
          cid,
          beforeCreatedAt,
          Number.isFinite(beforeId) ? beforeId : 0,
          limit + 1,
        ]
      : [cid, null, 0],
  );

  if (!usePagination) return NextResponse.json(res.rows);

  const hasMore = res.rows.length > limit;
  const messages = res.rows.slice(0, limit).reverse();
  return NextResponse.json({ messages, hasMore });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> },
) {
  const { cid } = await params;
  const { senderId, message, data, created_at, replyToMessageId } =
    await req.json();

  if (!senderId || !String(message || "").trim()) {
    return NextResponse.json(
      { error: "Sender and message are required" },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  let messageId: number | string | undefined;
  try {
    await client.query("BEGIN");
    if (replyToMessageId) {
      const parent = await client.query(
        `SELECT id FROM messages WHERE id = $1 AND conversation_id = $2`,
        [replyToMessageId, cid],
      );
      if (!parent.rowCount) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Reply message was not found" },
          { status: 400 },
        );
      }
    }
    const inserted = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, message, data, link_preview, created_at, reply_to_message_id)
       VALUES ($1, $2, $3, $4, NULL, $5, $6) RETURNING id`,
      [
        cid,
        senderId,
        message.trim(),
        data || null,
        created_at || new Date(),
        replyToMessageId || null,
      ],
    );
    messageId = inserted.rows[0]?.id;
    await client.query(
      `UPDATE conversations SET last_message = $1, last_updated = NOW() WHERE id = $2`,
      [message.trim(), cid],
    );
    await client.query("COMMIT");
    // Keep the existing notification and Firebase flow below the transaction.
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  sendNotificationFromMe(cid, Number(senderId), message.trim());

  if (messageId) {
    after(async () => {
      const linkPreview = await createLinkPreview(message.trim());
      if (!linkPreview) return;
      try {
        await pool.query(
          `UPDATE messages SET link_preview = $1 WHERE id = $2`,
          [linkPreview, messageId],
        );
        await admin
          .firestore()
          .collection("messages_meta")
          .doc(cid)
          .set({ updated: Date.now() }, { merge: true });
      } catch {
        // A preview is optional; never affect the delivered message on failure.
      }
    });
  }

  return NextResponse.json({ success: true });
}

async function sendNotificationFromMe(
  id: string,
  myId: number,
  message: string,
) {
  const convQuery = await pool.query(
    `
       SELECT c.*,
       u1.name AS participant1_name,
       u2.name AS participant2_name
FROM conversations c
LEFT JOIN users u1 ON c.participant_1 = u1.id
LEFT JOIN users u2 ON c.participant_2 = u2.id
WHERE c.id = $1
`,
    [id],
  );
  const conv = convQuery.rows[0];
  const otherUser =
    conv.participant_1 === myId
      ? { id: conv.participant_2, name: conv.participant2_name }
      : { id: conv.participant_1, name: conv.participant1_name };
  const myUser =
    conv.participant_1 !== myId
      ? { id: conv.participant_2, name: conv.participant2_name }
      : { id: conv.participant_1, name: conv.participant1_name };
  sendNotificationToMobile(
    message,
    myUser?.name || "No name",
    otherUser.id,
    { talkingTo: myUser.id },
    "message",
    `/dashboard/message/${myUser.id}?name=${myUser?.name || "No name"}`,
  );
}

export const revalidate = 0;
