import moment from "moment"
import admin from "./firebaseAdmin"
import pool from "@/config/db";



export const sendNotificationToMobile = async (title, sendTo, data, type) => {
    try {
        console.log("sending to mobile")
        const result = await pool.query(`SELECT token, id FROM users WHERE id = $1`, [sendTo])
        const message = {
            to: result.rows[0].token,
            sound: 'default',
            title: "Task",
            body: title,
            data: {...data, type : type, url : "/dashboard/task"},
        };

        await fetch('https://exp.host/--/api/v2/push/send', {
            mode: 'no-cors',
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        }).then(() => {
            console.log("sent")
        })




    } catch (error) {
        console.log("Error sending notification:", error)
    }
}





