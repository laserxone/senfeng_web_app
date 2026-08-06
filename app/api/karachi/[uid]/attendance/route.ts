import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import admin from "@/lib/firebaseAdmin";
import { GetAttendanceFromFirebase } from "@/lib/getAttendanceFromFirebase";
import UploadImageForMobile from "@/lib/uploadImageForMobile";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;
    const { note, location, image, task, reason, customer_id } =
      await req.json();

    if (!note || !location || !image) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const currentDate = moment().format("YYYY-MM-DD"); // Format the date
    const timestamp = new Date(); // Current time

    // Check if an attendance entry exists for the same date
    const checkQuery = `
        SELECT * FROM attendance 
        WHERE user_id = $1 
        AND DATE(time_in) = $2
      `;
    const checkResult = await pool.query(checkQuery, [uid, currentDate]);
    const fileName = `karachi/${uid}/attendance/${moment().valueOf()}.png`; // Unique file path

    if (checkResult.rows.length === 0) {
      UploadImageForMobile(image, fileName);
      const insertQuery = `
          INSERT INTO attendance (user_id, note_time_in, time_in, location_time_in, image_time_in, customer_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `;
      const insertResult = await pool.query(insertQuery, [
        uid,
        note,
        timestamp,
        location,
        fileName,
        customer_id || null,
      ]);

      await pool.query(
        `
            INSERT INTO task(
                assigned_to, status, task_name, type, created_at, customer_id
            )
            VALUES ($1, $2, $3, $4, NOW(), $5) 
        `,
        [uid, "Pending", task, reason, customer_id || null],
      );

      return NextResponse.json(
        { message: "Attendance marked time in", data: insertResult.rows[0] },
        { status: 201 },
      );
    }

    const existingAttendance = checkResult.rows[0];

    if (!existingAttendance.time_out) {
      UploadImageForMobile(image, fileName);
      const updateQuery = `
          UPDATE attendance 
          SET note_time_out = $1, time_out = $2, location_time_out = $3, image_time_out = $4
          WHERE id = $5
          RETURNING *;
        `;
      const updateResult = await pool.query(updateQuery, [
        note,
        timestamp,
        location,
        fileName,
        existingAttendance.id,
      ]);

      // await pool.query(`
      //     INSERT INTO task(
      //         assigned_to, status, task_name, type, created_at
      //     )
      //     VALUES ($1, $2, $3, $4, NOW())
      // `, [id, "Pending", task, reason]);

      return NextResponse.json(
        { message: "Attendance marked time out", data: updateResult.rows[0] },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Attendance already marked for the day" },
      { status: 400 },
    );
  } catch (error: any) {
    console.log("message:", error);
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const searchParams = req.nextUrl.searchParams;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const user = searchParams.get("user");
  const team = searchParams.get("team");

  const { uid } = await params;

  if (!uid) {
    return NextResponse.json({ message: "ID is missing" }, { status: 400 });
  }

  try {
    const isSuper = await checkSuperadmin(uid);

    let attendanceQuery = `
      SELECT 
        t.*,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM attendance t
      INNER JOIN users u ON t.user_id = u.id
      WHERE 1 = 1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // -----------------------------
    // Role-based filtering
    // -----------------------------
    if (isSuper || team === "true") {
      attendanceQuery += ` AND u.office = 'karachi'`;

      if (user) {
        attendanceQuery += ` AND t.user_id = $${paramIndex++}`;
        queryParams.push(Number(user));
      }
    } else {
      attendanceQuery += ` AND u.id = $${paramIndex++}`;
      queryParams.push(Number(uid));
    }

    // -----------------------------
    // Date filtering
    // -----------------------------
    if (start_date && end_date) {
      attendanceQuery += ` AND t.time_in BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(start_date, end_date);
      paramIndex += 2;
    }

    attendanceQuery += ` ORDER BY t.time_in DESC`;

    const attendanceResult = await pool.query(attendanceQuery, queryParams);

    // -----------------------------
    // Firebase Attendance
    // -----------------------------
    const firebaseAttendance = await GetAttendanceFromFirebase(
      start_date,
      end_date,
      user || uid,
      false,
    );

    // Normalize Firebase records
    const normalizedFirebaseAttendance = firebaseAttendance.map(
      (item, index) => ({
        ...item,
        record_type: "attendance",
        leave_id: null,
        leave_status: null,
        leave_date: null,
      }),
    );

    // -----------------------------
    // Normalize SQL Attendance
    // -----------------------------
    const sqlAttendance = attendanceResult.rows.map((item) => ({
      ...item,
      record_type: "attendance",
      leave_id: null,
      leave_status: null,
      leave_date: null,
    }));

    const allAttendance = [...sqlAttendance, ...normalizedFirebaseAttendance];

    // -----------------------------
    // Fetch Leave Records
    // -----------------------------
    const userIds = [
      ...new Set(
        allAttendance.map((item) => item.user_id).filter((id) => id !== null),
      ),
    ];

    const filteredUserIds =
      user && (isSuper || team === "true")
        ? [Number(user)]
        : userIds.length > 0
          ? userIds
          : [Number(uid)];

    let leaveRows = [];

    if (filteredUserIds.length > 0) {
      let leaveQuery = `
        SELECT 
          l.id AS leave_id,
          l.user_id,
          l.date AS leave_date,
          l.status AS leave_status,
          u.name AS user_name,
          u.email AS user_email
        FROM leave l
        INNER JOIN users u ON l.user_id = u.id
        WHERE l.user_id = ANY($1)
      `;

      const leaveParams: any[] = [filteredUserIds];
      let leaveParamIndex = 2;

      if (start_date && end_date) {
        leaveQuery += ` AND l.date BETWEEN $${leaveParamIndex} AND $${leaveParamIndex + 1}`;
        leaveParams.push(start_date, end_date);
      }

      const leaveResult = await pool.query(leaveQuery, leaveParams);
      leaveRows = leaveResult.rows;
    }

    // -----------------------------
    // Normalize Leave Records
    // -----------------------------
    const leaveData = leaveRows.map((leave) => ({
      id: `leave-${leave.leave_id}`,
      record_type: "leave",
      user_id: leave.user_id,
      user_name: leave.user_name,
      user_email: leave.user_email,
      date: leave.leave_date,
      time_in: null,
      time_out: null,
      note_time_in: null,
      note_time_out: null,
      location_time_in: [],
      location_time_out: [],
      image_time_in: null,
      image_time_out: null,
      customer_id: null,
      leave_id: leave.leave_id,
      leave_status: leave.leave_status,
      leave_date: leave.leave_date,
    }));

    // -----------------------------
    // Combine and Sort Data
    // -----------------------------
    const finalData = [...allAttendance, ...leaveData].sort((a, b) => {
      const dateA = new Date(a.time_in || a.leave_date || 0).getTime();
      const dateB = new Date(b.time_in || b.leave_date || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(finalData, { status: 200 });
  } catch (error: any) {
    console.log("Error inserting data: ", error);
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}

export const revalidate = 0;
