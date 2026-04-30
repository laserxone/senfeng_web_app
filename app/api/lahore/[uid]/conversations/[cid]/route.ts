import pool from '@/config/db';
import admin from '@/lib/firebaseAdmin';
import { sendNotificationToMobile } from '@/lib/sendNotificationToMobile';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req:NextRequest, { params }:{params:Promise<{cid:string}>}) {
    const { cid } = await params;
    const res = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [cid]
    );
    return NextResponse.json(res.rows);
}

export async function POST(req:NextRequest, { params }:{params:Promise<{cid:string}>}) {
    const { cid } = await params;
    const { senderId, message, data, created_at } = await req.json();

    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query(
        `INSERT INTO messages (conversation_id, sender_id, message, data, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [cid, senderId, message, data || null, created_at || new Date()]
    );
    await client.query(
        `UPDATE conversations SET last_message = $1, last_updated = NOW() WHERE id = $2`,
        [message, cid]
    );
    await client.query('COMMIT');
    client.release();

    sendNotificationFromMe(cid, Number(senderId), message)

    const db = admin.firestore();
    // await db.collection('conversations_meta').doc(cid).set({
    //     updated: Date.now(),
    // });

    return NextResponse.json({ success: true });
}

async function sendNotificationFromMe(id:string, myId:number, message:string) {
    const convQuery = await pool.query(`
       SELECT c.*,
       u1.name AS participant1_name,
       u2.name AS participant2_name
FROM conversations c
LEFT JOIN users u1 ON c.participant_1 = u1.id
LEFT JOIN users u2 ON c.participant_2 = u2.id
WHERE c.id = $1
`, [id])
    const conv = convQuery.rows[0]
    const otherUser = conv.participant_1 === myId
        ? { id: conv.participant_2, name: conv.participant2_name }
        : { id: conv.participant_1, name: conv.participant1_name };
    const myUser = conv.participant_1 !== myId
        ? { id: conv.participant_2, name: conv.participant2_name }
        : { id: conv.participant_1, name: conv.participant1_name };
    sendNotificationToMobile(message, myUser?.name || "No name", otherUser.id, { talkingTo: myUser.id }, "message", `/dashboard/message/${myUser.id}?name=${myUser?.name || "No name"}`)


}

export const revalidate = 0
