import admin from "@/lib/firebaseAdmin";

/** Refreshes the pending-approval count for one notification recipient. */
export async function TriggerFirebaseForPendingApprovals(
  userId: string | number,
) {
  if (!userId) return;

  await admin
    .firestore()
    .collection("pending-approvals")
    .doc(String(userId))
    .set(
      { updated: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
}
