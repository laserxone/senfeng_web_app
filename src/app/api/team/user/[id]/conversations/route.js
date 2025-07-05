import pool from '@/config/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { id } = await params;
  const res = await pool.query(`
    SELECT c.id, c.last_message, c.last_updated,
      CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END AS other_id,
      u.name AS other_name
    FROM conversations c
    JOIN users u ON u.id = CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END
    WHERE participant_1 = $1 OR participant_2 = $1
    ORDER BY c.last_updated DESC
  `, [id]);
  return NextResponse.json(res.rows);
}


export async function POST(req) {
  try {
    const { user1, user2 } = await req.json();

    if (!user1 || !user2) {
      return NextResponse.json({ error: "Missing user ids" }, { status: 400 });
    }

    // Check if conversation already exists
    const existing = await pool.query(
      `SELECT * FROM conversations 
       WHERE (participant_1 = $1 AND participant_2 = $2) 
          OR (participant_1 = $2 AND participant_2 = $1)`,
      [user1, user2]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(existing.rows[0], { status: 200 });
    }

    // Create new conversation
    const result = await pool.query(
      `INSERT INTO conversations (participant_1, participant_2) 
       VALUES ($1, $2) RETURNING *`,
      [user1, user2]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const revalidate = 0