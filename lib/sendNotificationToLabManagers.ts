import pool from "@/config/db"
import moment from "moment"
import admin from "./firebaseAdmin"
import { NotificationCategory } from "@/constants/notifications"

export const sendNotificationToLabManagers = async (
  description: string,
  page: string,
  office: string,
  category: NotificationCategory,
  title: string
) => {
  try {
    const ownersResult = await pool.query(
      `SELECT id FROM users WHERE repairing_and_maintenance IS TRUE AND office = '${office}'`
    )
    const ownerIds = ownersResult.rows.map((owner) => owner.id)

    const TimeStamp = moment().valueOf()

    const notifications = ownerIds.map((eachId) => ({
      TimeStamp,
      page,
      title,
      read: false,
      description,
      sendTo: eachId,
      category,
    }))

    const db = admin.firestore()
    const batch = db.batch()

    notifications.forEach((notification) => {
      const docRef = db.collection("Notification").doc()
      batch.set(docRef, notification)
    })

    await batch.commit()

    console.log("Notification sent")
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}
