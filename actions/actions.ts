"use server";

import admin from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";

export async function deleteResume(id: string) {
  if (!id) {
    return {
      success: false,
      message: "Resume ID is required.",
    };
  }

  try {
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const resumeRef = db.collection("resume").doc(id);
    const resumeSnap = await resumeRef.get();

    if (!resumeSnap.exists) {
      return {
        success: false,
        message: "Resume not found.",
      };
    }

    const resumeData = resumeSnap.data();

    if (resumeData?.cvUrl) {
      try {
        await bucket.file(resumeData.cvUrl).delete();
      } catch (error) {
        console.error("Storage delete error:", error);
      }
    }

    await resumeRef.delete();

    revalidatePath("/admin/resumes");

    return {
      success: true,
      message: "Resume deleted successfully.",
    };
  } catch (error) {
    console.error("Delete resume action error:", error);

    return {
      success: false,
      message: "Something went wrong.",
    };
  }
}