import pool from "@/config/db";
import { TIMEZONE } from "@/constants/data";
import { NOTIFICATION_TYPES } from "@/constants/notifications";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import { sendNotification } from "@/lib/sendNotification";
import { sendNotificationToMobile } from "@/lib/sendNotificationToMobile";
import { sendNotificationToOwner } from "@/lib/sendNotificationToOwner";
import momentT from "moment-timezone";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      task_name,
      type,
      client,
      status,
      assigned_to,
      assigned_by,
      problem,
      solution,
    } = await req.json();

    if (!task_name || !type || !status || !assigned_to) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    let taskName = task_name;

    if (client) {
      const clientResult = await pool.query(
        "SELECT id, name, owner, ownership FROM customer WHERE id = $1",
        [client],
      );
      if (clientResult.rows.length > 0) {
        taskName += ` - ${clientResult.rows[0].name || clientResult.rows[0].owner}`;
        const query = `
                INSERT INTO task(
                    assigned_to, status, task_name, type, created_at, customer_id, assigned_by, problem, solution
                )
                VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8) 
            `;
        const values = [
          assigned_to,
          status,
          taskName,
          type,
          client,
          assigned_by || null,
          problem,
          solution,
        ];
        const newTask = await pool.query(query, values);

        if (assigned_by && assigned_by !== assigned_to) {
          const engineerName = await pool.query(
            `SELECT id, name FROM users WHERE id = $1`,
            [assigned_to],
          );

          sendNotificationToMobile(
            `Task assigned: ${taskName}`,
            "Task",
            assigned_to,
            newTask.rows[0],
            "task",
            "/dashboard/task",
          );

          sendNotificationToMobile(
            `Task: ${taskName} to ${engineerName.rows[0].name}`,
            "Task for engineer",
            clientResult.rows[0].ownership,
            {},
            "task",
            "/dashboard",
          );
        }

        return NextResponse.json(
          { message: "Task created successfully" },
          { status: 201 },
        );
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
      const start = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const end = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();
      sendNotification(
        `Task assigned: ${taskName}`,
        `task?t=${newTask.rows?.[0]?.id}&start=${start}&end=${end}`,
        assigned_to,
        NOTIFICATION_TYPES.task_assigned.title,
        NOTIFICATION_TYPES.task_assigned.category,
      );
      sendNotificationToOwner(
        `Task assigned: ${taskName}`,
        `task?t=${newTask.rows?.[0]?.id}&start=${start}&end=${end}`,
        "karachi",
        NOTIFICATION_TYPES.task_assigned.category,
        NOTIFICATION_TYPES.task_assigned.title,
      );
    }

    return NextResponse.json(
      { message: "Task created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error inserting task data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const user = searchParams.get("user");
  const by = searchParams.get("by");

  let queryParams = [];

  try {
    const isAdmin = await checkSuperadmin(uid);
    if (isAdmin) {
      let query = `
     SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email,
    c.name AS customer_name,
    c.owner AS customer_owner,
    ab.name AS assigned_by_name
FROM task t
INNER JOIN users u ON t.assigned_to = u.id
LEFT JOIN users ab ON t.assigned_by = ab.id
LEFT JOIN customer c ON t.customer_id = c.id
WHERE u.office = 'karachi'
    `;

      if (start_date && end_date) {
        query += ` AND t.created_at BETWEEN $1 AND $2`;
        queryParams.push(start_date, end_date);
      }
      if (user) {
        query += ` AND t.assigned_to = $3`;
        queryParams.push(user);
      }
      query += ` ORDER BY t.created_at DESC;`;

      const result = await pool.query(query, queryParams);

      const teamTasks = result.rows;
      const updatedTasks = teamTasks.map((task) => {
        if (task.customer_id) {
          const [firstPart] = task.task_name.split("-");
          const customerInfo = task.customer_name || task.customer_owner || "";
          const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
          return {
            ...task,
            task_name: updatedTitle,
          };
        }
        return task;
      });

      return NextResponse.json(updatedTasks, { status: 200 });
    } else {
      if (by) {
        let query = `
     SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email,
    c.name AS customer_name,
    c.owner AS customer_owner,
    c.number AS customer_number,
    c.address AS customer_address,
    c.pin AS customer_pin
FROM task t
INNER JOIN users u ON t.assigned_to = u.id
LEFT JOIN customer c ON t.customer_id = c.id
WHERE t.assigned_by = $1
    `;

        const queryParams = [uid];

        if (start_date && end_date) {
          query += ` AND t.created_at BETWEEN $2 AND $3`;
          queryParams.push(start_date, end_date);
        }
        query += ` ORDER BY t.created_at DESC;`;
        const result = await pool.query(query, queryParams);

        const teamTasks = result.rows;
        const updatedTasks = teamTasks.map((task) => {
          if (task.customer_id) {
            const [firstPart] = task.task_name.split("-");
            const customerInfo =
              task.customer_name || task.customer_owner || "";
            const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
            return {
              ...task,
              task_name: updatedTitle,
            };
          }
          return task;
        });

        return NextResponse.json(updatedTasks, { status: 200 });
      } else {
        let query = `
     SELECT 
    t.*, 
    u.id AS user_id, 
    u.name AS assigned_to_name,
    u.email AS assigned_to_email,
    c.name AS customer_name,
    c.owner AS customer_owner,
    c.number AS customer_number,
    c.address AS customer_address,
    c.pin AS customer_pin
FROM task t
INNER JOIN users u ON t.assigned_to = u.id
LEFT JOIN customer c ON t.customer_id = c.id
WHERE u.id = $1
    `;

        const queryParams = [uid];

        if (start_date && end_date) {
          query += ` AND t.created_at BETWEEN $2 AND $3`;
          queryParams.push(start_date, end_date);
        }
        query += ` ORDER BY t.created_at DESC;`;
        const result = await pool.query(query, queryParams);

        const teamTasks = result.rows;
        const updatedTasks = teamTasks.map((task) => {
          if (task.customer_id) {
            const [firstPart] = task.task_name.split("-");
            const customerInfo =
              task.customer_name || task.customer_owner || "";
            const updatedTitle = `${firstPart.trim()} - ${customerInfo}`;
            return {
              ...task,
              task_name: updatedTitle,
            };
          }
          return task;
        });

        return NextResponse.json(updatedTasks, { status: 200 });
      }
    }
  } catch (error: any) {
    console.error("Error inserting data: ", error);
    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
