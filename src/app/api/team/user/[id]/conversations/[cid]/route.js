import pool from '@/config/db';
import admin from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    const { cid } = await params;
    const res = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [cid]
    );
    return NextResponse.json(res.rows);
}

export async function POST(req, { params }) {
    const { cid } = await params;
    const { senderId, receiverId, message } = await req.json();

    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, message) VALUES ($1, $2, $3, $4)`,
        [cid, senderId, receiverId, message]
    );
    await client.query(
        `UPDATE conversations SET last_message = $1, last_updated = NOW() WHERE id = $2`,
        [message, cid]
    );
    await client.query('COMMIT');
    client.release();

    const db = admin.firestore();
    await db.collection('messages_meta').doc(conversationId).set({
        last_message: message,
        last_updated: Date.now(),
        by: senderId
    });

    return NextResponse.json({ success: true });
}
