import pool from "@/config/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { NextResponse } from "next/server"

// export async function POST(req) {

//     const { data } = await req.json();
//     const client = await pool.connect();

//     try {
//         for (const item of data) {
//             // Lookup user ID using email
//             const userQuery = `SELECT id FROM users WHERE email = $1`;
//             const userResult = await client.query(userQuery, [item.assignedTo]);

//             let submittedById = userResult.rows.length ? userResult.rows[0].id : null;

//             const query = `
//                 INSERT INTO task(
//                     created_at, assigned_to, status, task_name , type
//                 )
//                 VALUES (
//                     TO_TIMESTAMP($1 / 1000.0), $2, $3, $4, $5
//                 )
//             `;

//             const values = [
//                 Number(item.TimeStamp), // created_at (converted from ms)
//                 submittedById,
//                 item.status, // description
//                 item.taskName, // image
//                 item.type
//             ];

//             await client.query(query, values);
//         }

//         console.log('task data inserted successfully');
//     } catch (error) {
//         console.error('Error inserting task data:', error);
//     } finally {
//         client.release();
//     }



//     return NextResponse.json({ message: 'done' }, { status: 200 })
// }


export async function POST(req) {
    try {
        const { task_name, type, client, status, assigned_to, assigned_by, problem, solution } = await req.json();

        if (!task_name || !type || !status || !assigned_to) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        let taskName = task_name;

        if (client) {
            const clientResult = await pool.query("SELECT name, owner FROM customer WHERE id = $1", [client]);
            if (clientResult.rows.length > 0) {
                taskName += ` - ${clientResult.rows[0].name || clientResult.rows[0].owner}`;
                const query = `
                INSERT INTO task(
                    assigned_to, status, task_name, type, created_at, customer_id, assigned_by, problem, solution
                )
                VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8) 
            `;
                const values = [assigned_to, status, taskName, type, client, assigned_by || null, problem, solution];
                const newTask = await pool.query(query, values);

                if (assigned_by && assigned_by !== assigned_to) {

                    sendNotificationToMobile(`Task assigned: ${taskName}`, assigned_to, newTask.rows[0], "task")
                }

                return NextResponse.json({ message: "Task created successfully" }, { status: 201 });
            }
        }

        const query = `
        INSERT INTO task(
            assigned_to, status, task_name, type, created_at, assigned_by
        )
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *
    `;

        const values = [assigned_to, status, taskName, type, assigned_by || null];
        const newTask = await pool.query(query, values);

        if (assigned_by && assigned_by !== assigned_to) {
            sendNotification(`Task assigned: ${taskName}`, "task", assigned_to)
        }

        return NextResponse.json({ message: "Task created successfully" }, { status: 201 });





    } catch (error) {
        console.error("Error inserting task data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}



export async function GET(req) {


    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get("user")
    const by = searchParams.get("by")

    let queryParams = []

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
    `;

        if (start_date && end_date) {
            query += ` WHERE t.created_at BETWEEN $1 AND $2`;
            queryParams.push(start_date, end_date);
        }
        if (user) {
            query += ` AND t.assigned_to = $3`;
            queryParams.push(user);
        } else if (by) {
            query += ` AND t.assigned_by = $3`;
            queryParams.push(by);
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
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }


}



export const revalidate = 0