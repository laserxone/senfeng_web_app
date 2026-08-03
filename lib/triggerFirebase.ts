"use client"

import { db } from "@/config/firebase"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"

export async function TriggerFirebase(id: string, sender: undefined | string) {
  if (id) {
    await setDoc(doc(db, "messages_meta", id), {
      updated: serverTimestamp(),
    })
  }

  if (sender) {
    await setDoc(doc(db, "conversations_meta", sender), {
      updated: serverTimestamp(),
    })
  }
}

export async function TriggerFirebaseForMachine() {
  await setDoc(doc(db, "machine-delivery", "delivery"), {
    updated: serverTimestamp(),
  })
}

export async function TriggerFirebaseForPendingPayments() {
  await setDoc(doc(db, "payment-requests", "requests"), {
    updated: serverTimestamp(),
  })
}

export async function TriggerFirebaseForChequeAlerts() {
  await setDoc(doc(db, "cheque-alerts", "cheques"), {
    updated: serverTimestamp(),
  })
}

export async function TriggerFirebaseForFine(id: string | number | undefined) {
  if (id) {
    await setDoc(doc(db, "fine_notification", id.toString()), {
      updated: serverTimestamp(),
    })
  }
}
