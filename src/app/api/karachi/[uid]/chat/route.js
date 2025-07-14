import {karachi_pool as pool} from "@/config/db"
import { NextResponse } from "next/server"


export async function GET(req, { params }) {
    const { uid } = await params;

    if (!uid) {
        return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    const userId = Number(uid);

    try {
        const usersResult = await pool.query(
            `SELECT id, name, designation, dp FROM users WHERE id != $1 ORDER BY name ASC`,
            [userId]
        );

        const conversationsResult = await pool.query(
            `SELECT 
        c.*,
        u1.id AS participant_1_id, u1.name AS participant_1_name,
        u2.id AS participant_2_id, u2.name AS participant_2_name
      FROM conversations c
      LEFT JOIN users u1 ON c.participant_1 = u1.id
      LEFT JOIN users u2 ON c.participant_2 = u2.id
      WHERE c.participant_1 = $1 OR c.participant_2 = $1
      ORDER BY c.last_updated DESC`,
            [userId]
        );

        const conversations = conversationsResult.rows;

        const conversationMap = new Map();

        for (const conv of conversations) {
            const otherId =
                conv.participant_1_id === userId
                    ? conv.participant_2_id
                    : conv.participant_1_id;

            const unreadRes = await pool.query(
                `SELECT COUNT(*) AS unread_count
         FROM messages
         WHERE conversation_id = $1
           AND sender_id != $2
           AND is_read = false`,
                [conv.id, Number(userId)]
            );

            const unreadCount = parseInt(unreadRes.rows[0].unread_count, 10);

            conversationMap.set(otherId, {
                id: conv.id,
                last_message: conv.last_message,
                last_updated: conv.last_updated,
                participant_1: conv.participant_1_id,
                participant_2: conv.participant_2_id,
                participant_1_info: {
                    id: conv.participant_1_id,
                    name: conv.participant_1_name,
                },
                participant_2_info: {
                    id: conv.participant_2_id,
                    name: conv.participant_2_name,
                },
                unreadCount,
            });
        }

        const usersWithConversation = [];
        const usersWithoutConversation = [];

        for (const user of usersResult.rows) {
            const conversation = conversationMap.get(user.id);
            const userData = {
                ...user,
                conversation: conversation || null,
                unreadCount: conversation ? conversation.unreadCount : 0,
            };

            if (conversation) {
                usersWithConversation.push(userData);
            } else {
                usersWithoutConversation.push(userData);
            }
        }

        usersWithConversation.sort((a, b) =>
            new Date(b.conversation.last_updated) - new Date(a.conversation.last_updated)
        );

        const finalUserList = [...usersWithConversation, ...usersWithoutConversation];

        return NextResponse.json(finalUserList, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}