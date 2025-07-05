"use client"

import { db } from "@/config/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";


export async function TriggerFirebase(id, sender = null) {
    await setDoc(doc(db, "messages_meta", id), {
        updated: serverTimestamp(),
    });

    if (sender) {
        await setDoc(doc(db, "conversations_meta", sender), {
            updated: serverTimestamp(),
        });
    }
}
