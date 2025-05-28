
import {karachi_pool as pool} from "@/config/db";
import { NextResponse } from "next/server"


export async function GET(req, { params }) {

    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    try {
        let query = `
     SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email,
    c.name AS customer_name,
    c.owner AS customer_owner
FROM task t
INNER JOIN users u ON t.assigned_to = u.id
LEFT JOIN customer c ON t.customer_id = c.id
WHERE u.id = $1
    `;

        const queryParams = [id];

        if (start_date && end_date) {
            query += ` AND t.created_at BETWEEN $2 AND $3`;
            queryParams.push(start_date, end_date);
        }
        query += ` ORDER BY t.created_at DESC;`;
        const result = await pool.query(query, queryParams);
       
        
        const teamTasks = result.rows
        const updatedTasks = teamTasks.map(task => {

            if (task.customer_id) {
                const [firstPart] = task.task_name.split("-");
                const customerInfo = task.customer_name || task.customer_owner || "";
                const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
                return {
                    ...task,
                    task_name: updatedTitle
                };
            }
            return task;
        });




        return NextResponse.json(updatedTasks, { status: 200 })

    } catch (error) {
        console.error('Error fetching data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}


export const revalidate = 0