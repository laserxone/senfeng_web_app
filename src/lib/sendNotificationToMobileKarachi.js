import { karachi_pool as pool } from "@/config/db";
import axios from "axios";


const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const sendNotificationToMobileKarachi = async (title, heading, sendTo, passingdata, type, url) => {
   
    try {
       
        const result = await pool.query(`SELECT token FROM users WHERE id = $1`, [sendTo]);

        if (!result.rows.length || !result.rows[0].token) {
            console.log("No token found for user", sendTo);
            return;
        }

        

        const message = {
            to: result.rows[0].token,
            sound: 'default',
            title: heading,
            body: title,
            data: { ...passingdata, type, url },
        };

        const maxRetries = 3;
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
            try {
                const response = await axios.post(
                    'https://exp.host/--/api/v2/push/send',
                    message,
                    {
                        headers: {
                            Accept: 'application/json',
                            'Accept-Encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log(`Notification sent (attempt ${attempt + 1}):`, response.data);

                if (response.data?.data?.status === 'ok') {
                    success = true;
                } else {
                    throw new Error('Expo notification status not ok');
                }

            } catch (err) {
                console.log(`Attempt ${attempt + 1} failed:`, err.message || err);
                attempt++;
                if (attempt < maxRetries) {
                    console.log('Retrying in 1 second...');
                    await delay(1000);
                }
            }
        }

        if (!success) {
            console.log('All notification attempts failed.');
        }

    } catch (error) {
        console.log("Error sending notification:", error.message || error);
    }
}





