import admin from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Resume ID is required." },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const resumeRef = db.collection("resume").doc(id);
    const resumeSnap = await resumeRef.get();

    if (!resumeSnap.exists) {
      return NextResponse.json(
        { message: "Resume not found." },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    console.error("Delete resume error:", error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}