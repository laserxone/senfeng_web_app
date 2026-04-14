// lib/verifyIdToken.ts
import admin from './firebaseAdmin';

export async function verifyToken(token) {
    return admin.auth().verifyIdToken(token);
}
