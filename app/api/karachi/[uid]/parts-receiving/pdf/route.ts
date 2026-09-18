import ReceivingNotePdf from "@/components/features/parts-receiving/receiving-note-pdf";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body?.data;
    const format = body?.format;

    if (!data) {
      return Response.json(
        { message: "Parts receiving note data is required" },
        { status: 400 },
      );
    }

    const document = React.createElement(ReceivingNotePdf, {
      data,
    }) as React.ReactElement<DocumentProps>;
    const pdfBuffer = await renderToBuffer(document);
    const fileName = `Parts-Receiving-PRN-${String(data.receiptId || "").padStart(6, "0")}.pdf`;

    if (format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: Buffer.from(pdfBuffer).toString("base64"),
      });
    }

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Parts receiving PDF generation failed:", error);
    return Response.json(
      { message: "Failed to generate parts receiving note PDF" },
      { status: 500 },
    );
  }
}
