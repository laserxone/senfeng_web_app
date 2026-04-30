import pool from "@/config/db";
import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req:NextRequest, { params }:{params:Promise<{cid:string,uid:string}>}) {
  const { cid: conversationId, uid } = await params;
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
      [conversationId, Number(userId)]
    );

     const db = admin.firestore();
     await db.collection('conversations_meta').doc(userId.toString()).set({
        last_updated: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const revalidate = 0