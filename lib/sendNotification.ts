import moment from "moment"
import admin from "./firebaseAdmin"
import { NotificationCategory } from "@/constants/notifications";



export const sendNotification = async (description : string, page : string, sendTo : string, title : string, category : NotificationCategory) => {
  if(!sendTo) return
    try {
      const TimeStamp = moment().valueOf()
  
      const notification = {
        TimeStamp,
        page,
        read: false,
        title,
        sendTo,
        category,
        description
      }
  
      const db = admin.firestore()
      const docRef = db.collection("Notification").doc()
      await docRef.set(notification)
  
      console.log("Notification sent")
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }