import {karachi_pool as pool} from "@/config/db";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {

    const { id } = await params

    try {

       const task = await pool.query(
            `
    SELECT 
    r.id,
    r.created_at,
    r.customer_id,
    r.assigned_to, 
    r.task_name,
    r.status,
    u.id AS user_id, 
    u.name AS user_name,
      c.name AS customer_name,
     c.owner AS customer_owner
FROM task r
LEFT JOIN users u ON r.assigned_to = u.id
LEFT JOIN customer c ON r.customer_id = c.id
WHERE r.customer_id = $1
    `, [id]);

        const teamTasks = task.rows
        const updatedTasks = teamTasks.map(task => {

            if (task.customer_id) {
                const [firstPart] = task.task_name.split("-");
                const customerInfo = task.customer_name || task.customer_owner || "";
                const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
                return {
                    ...task,
                    task_name: updatedTitle,
                    created_at_time: task.created_at
                };
            }
            return task;
        });

        return NextResponse.json(updatedTasks, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 })
    }
}

export const revalidate = 0