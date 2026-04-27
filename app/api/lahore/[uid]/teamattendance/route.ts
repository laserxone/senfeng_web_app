import pool from "@/config/db";
import { checkSuperadmin } from "@/lib/checkSuperadmin";
import admin from "@/lib/firebaseAdmin";
import UploadImageForMobile from "@/lib/uploadImageForMobile";
import moment from "moment";
import { NextResponse } from "next/server";



export async function GET(req, { params }) {

    const searchParams = req.nextUrl.searchParams
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const user = searchParams.get("user")

    const { uid } = await params

    if (!uid) {
        return NextResponse.json({ message: "ID is missing" }, { status: 400 })
    }


    try {
        const isSuper = await checkSuperadmin(uid)


        let query = `
        SELECT 
            t.*, 
            u.id AS user_id, 
            u.name AS user_name,
            u.email AS user_email
        FROM attendance t
        INNER JOIN users u ON t.user_id = u.id
        WHERE designation = 'Engineer'
    `;

        const queryParams = [];

        if (start_date && end_date) {
            query += ` AND t.time_in BETWEEN $1 AND $2`;
            queryParams.push(start_date, end_date);
        }

        if (user) {
            query += ` AND t.user_id = $3`
            queryParams.push(user);
        }

        query += ` ORDER BY t.time_in DESC;`;

        const result = await pool.query(query, queryParams);

        const db = admin.firestore();


        const processedStartDate = moment(start_date).startOf("day")
        const processedEndDate = moment(end_date).endOf("day")
        let snapshot
        if (!user) {
            snapshot = await db.collection("EmployeeAttendance")
                .where("timeIn", ">=", processedStartDate.valueOf())
                .where("timeIn", "<=", processedEndDate.valueOf())
                .get();

        } else {
            const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [user])
            if (userResult.rows.length > 0) {
                const userEmail = userResult.rows[0].email
                snapshot = await db.collection("EmployeeAttendance")
                    .where("timeIn", ">=", processedStartDate.valueOf())
                    .where("timeIn", "<=", processedEndDate.valueOf())
                    .where("attendanceBy", '==', userEmail)
                    .get();
            }
        }


        const attendanceRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const preparedData = attendanceRecords.map((item) => {
            return {
                time_in: item?.timeIn ? moment(item?.timeIn).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
                note_time_in: item?.noteTimeIn || null,
                location_time_in: item?.locationTimeIn || [],
                image_time_in: item?.imageTimeIn || null,
                time_out: item?.timeOut ? moment(item?.timeOut).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]") : null,
                note_time_out: item?.noteTimeOut || null,
                location_time_out: item?.locationTimeOut || [],
                image_time_out: item?.imageTimeOut || null,
                user_email: item?.attendanceBy || null
            }
        })


        const userQuery = await pool.query(`SELECT name, email FROM users`)


        const userMap = {};
        userQuery.rows.forEach(user => {
            userMap[user.email] = user.name;
        });

        const enrichedData = preparedData.map(item => ({
            ...item,
            user_name: userMap[item.user_email] || "Unknown"
        }));

        const finalData = [...result.rows, ...enrichedData]

        finalData.sort((a, b) => new Date(b.time_in) - new Date(a.time_in))
        if (user) {
            const uniqueData = [];
            const seenDates = new Set();

            finalData.forEach(item => {
                const formattedDate = moment(item.time_in).format("YYYY-MM-DD");
                if (!seenDates.has(formattedDate)) {
                    seenDates.add(formattedDate);
                    uniqueData.push(item);
                }
            });


            return NextResponse.json(uniqueData, { status: 200 })
        } else {
            return NextResponse.json(finalData, { status: 200 })
        }



    }

    catch (error) {
        console.log('Error inserting data: ', error);
        return NextResponse.json({ message: error?.message || "Something went wrong" }, { status: 500 })
    }


}





export const revalidate = 0