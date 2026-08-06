import admin from "./firebaseAdmin";

export default async function deleteImageByPath(filePath: string | null) {
  if (!filePath) return;
  const bucket = admin.storage().bucket();
  try {
    await bucket.file(filePath).delete();
    return { success: true };
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error?.code === 404) {
      return { success: true, message: "File already deleted" };
    }
    throw error;
  }
}
