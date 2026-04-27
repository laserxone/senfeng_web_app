import moment from "moment"
import admin from "./firebaseAdmin"



export const sendNotification = async (title : string, page : string, sendTo : string) => {
    try {
      const TimeStamp = moment().valueOf()
  
      const notification = {
        TimeStamp,
        page,
        read: false,
        title,
        sendTo
      }
  
      const db = admin.firestore()
      const docRef = db.collection("Notification").doc()
      await docRef.set(notification)
  
      console.log("Notification sent")
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }