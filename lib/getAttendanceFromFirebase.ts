import moment from "moment";
import admin from "./firebaseAdmin";
import pool from "@/config/db";

export async function GetAttendanceFromFirebase(start_date : string | null,end_date : string | null, user : string | number, cond = true ) {

    if(!cond) return []

  const db = admin.firestore();

  const processedStartDate = moment(start_date).startOf("day");
  const processedEndDate = moment(end_date).endOf("day");
  let snapshot;
  if (!user) {
    snapshot = await db
      .collection("EmployeeAttendance")
      .where("timeIn", ">=", processedStartDate.valueOf())
      .where("timeIn", "<=", processedEndDate.valueOf())
      .get();
  } else {
    const userResult = await pool.query(
      `SELECT email FROM users WHERE id = $1`,
      [user],
    );
    if (userResult.rows.length > 0) {
      const userEmail = userResult.rows[0].email;
      snapshot = await db
        .collection("EmployeeAttendance")
        .where("timeIn", ">=", processedStartDate.valueOf())
        .where("timeIn", "<=", processedEndDate.valueOf())
        .where("attendanceBy", "==", userEmail)
        .get();
    }
  }

  const attendanceRecords = snapshot?.docs?.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const preparedData = attendanceRecords?.map((item : any) => {
    return {
      time_in: item?.timeIn
        ? moment(item?.timeIn).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
        : null,
      note_time_in: item?.noteTimeIn || null,
      location_time_in: item?.locationTimeIn || [],
      image_time_in: item?.imageTimeIn || null,
      time_out: item?.timeOut
        ? moment(item?.timeOut).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
        : null,
      note_time_out: item?.noteTimeOut || null,
      location_time_out: item?.locationTimeOut || [],
      image_time_out: item?.imageTimeOut || null,
      user_email: item?.attendanceBy || null,
    };
  });

  const userQuery = await pool.query(`SELECT name, email FROM users`);

  const userMap : any = {};
  userQuery.rows.forEach((user : any) => {
    userMap[user.email] = user.name;
  });

  const data = preparedData?.map((item) => ({
    ...item,
    user_name: userMap[item.user_email] || "Unknown",
  }));

  return data ?? []
} 
