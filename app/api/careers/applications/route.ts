import pool from "@/config/db";
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

    const bucket = admin.storage().bucket();
    const bytes = await cv.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFileName = cv.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `resumes/${emailAddress}/${Date.now()}-${safeFileName}`;

    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType: cv.type,
        metadata: {
          fullName,
          emailAddress,
        },
      },
      resumable: false,
    });

    const cvUrl = storagePath;

    await pool.query(
      `
      INSERT INTO resumes (
        full_name,
        email_address,
        phone_number,
        current_location,
        position_applied_for,
        experience_years,
        cover_letter,
        cv_url,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      `,
      [
        fullName,
        emailAddress,
        phoneNumber,
        currentLocation,
        positionAppliedFor,
        Number(experienceYears || 0),
        coverLetter,
        cvUrl,
        "new",
      ]
    );

    return NextResponse.json(
      {
        message: "Application received successfully.",
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

export async function GET() {
  try {
    const res = await pool.query(`SELECT * FROM resumes`);

    const resumes = (
      await Promise.all(
        res.rows.map(async (data) => {
          try {
            if (!data.cv_url) return null;

            const [cvDownloadUrl] = await admin
              .storage()
              .bucket()
              .file(data.cv_url)
              .getSignedUrl({
                action: "read",
                expires: "03-01-2500",
              });

            return {
              ...data,
              cvDownloadUrl,
            };
          } catch (error) {
            console.error(
              `CV URL generation error for resume ${data.id}:`,
              error
            );

            return null;
          }
        })
      )
    ).filter(Boolean);

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