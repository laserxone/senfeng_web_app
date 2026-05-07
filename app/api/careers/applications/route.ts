import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.WORDPRESS_API_SECRET}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const fullName = formData.get("full_name") as string;
    const emailAddress = formData.get("email_address") as string;
    const phoneNumber = formData.get("phone_number") as string;
    const currentLocation = formData.get("current_location") as string;
    const positionAppliedFor = formData.get("position_applied_for") as string;
    const experienceYears = formData.get("experience_years") as string;
    const coverLetter = formData.get("cover_letter") as string;
    const cv = formData.get("cv") as File | null;

    if (!fullName || !emailAddress || !cv) {
      return NextResponse.json(
        { message: "Full name, email, and CV are required." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(cv.type)) {
      return NextResponse.json(
        { message: "Only PDF, DOC, and DOCX files are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (cv.size > maxSize) {
      return NextResponse.json(
        { message: "CV size must be less than 10MB." },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const resumeRef = db.collection("resume").doc();
    const applicationId = resumeRef.id;

    const bytes = await cv.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFileName = cv.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `resumes/${applicationId}/${Date.now()}-${safeFileName}`;

    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType: cv.type,
        metadata: {
          fullName,
          emailAddress,
          applicationId,
        },
      },
      resumable: false,
    });

    const cvUrl = storagePath;

    const application = {
      id: applicationId,
      fullName,
      emailAddress,
      phoneNumber,
      currentLocation,
      positionAppliedFor,
      experienceYears: Number(experienceYears || 0),
      coverLetter,
      cvUrl,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await resumeRef.set(application);
    return NextResponse.json(
      {
        message: "Application received successfully.",
        applicationId,
        cvUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Career application error:", error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    
    const db = admin.firestore();

    const snapshot = await db
      .collection("resume")
      .orderBy("createdAt", "desc")
      .get();

    const resumes = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        let cvDownloadUrl = null;

        try {
          if (data.cvUrl) {
            const [url] = await admin
              .storage()
              .bucket()
              .file(data.cvUrl)
              .getSignedUrl({
                action: "read",
                expires: "03-01-2500",
              });

            cvDownloadUrl = url;
          }
        } catch (error) {
          console.error("CV URL generation error:", error);
        }

        return {
          id: doc.id,
          ...data,
          cvDownloadUrl,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        total: resumes.length,
        resumes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get resumes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}