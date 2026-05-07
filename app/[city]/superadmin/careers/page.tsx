import admin from "@/lib/firebaseAdmin";
import ResumesTable from "./resumes-table";

async function getResumes() {
  const db = admin.firestore();

  const snapshot = await db
    .collection("resume")
    .orderBy("createdAt", "desc")
    .get();

  const resumes = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();

      let cvDownloadUrl = null;

      if (data.cvUrl) {
        try {
          const [url] = await admin
            .storage()
            .bucket()
            .file(data.cvUrl)
            .getSignedUrl({
              action: "read",
              expires: Date.now() + 60 * 60 * 1000,
            });

          cvDownloadUrl = url;
        } catch (error) {
          console.error("Signed URL error:", error);
        }
      }

      return {
        id: doc.id,
        fullName: data.fullName || "",
        emailAddress: data.emailAddress || "",
        phoneNumber: data.phoneNumber || "",
        currentLocation: data.currentLocation || "",
        positionAppliedFor: data.positionAppliedFor || "",
        experienceYears: data.experienceYears || 0,
        coverLetter: data.coverLetter || "",
        status: data.status || "new",
        cvUrl: data.cvUrl || "",
        cvDownloadUrl,
      };
    })
  );

  return resumes;
}

export default async function ResumesPage() {
  const resumes = await getResumes();

  return <ResumesTable resumes={resumes} />;
}