import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { QuotationPDF } from "@/components/features/quotations/quotation-pdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = body?.data;
    const format = body?.format; // "base64" for mobile

    if (!data) {
      return Response.json(
        { message: "Quotation data is required" },
        { status: 400 }
      );
    }

    const quotationDocument = React.createElement(QuotationPDF, {
      data,
    }) as React.ReactElement<DocumentProps>;

    const generatedPdfBuffer = await renderToBuffer(quotationDocument);

    let finalPdfBytes: Uint8Array = new Uint8Array(generatedPdfBuffer);

    if (data?.original_pdf) {
      const firebasePdfResponse = await fetch(data.original_pdf);

      if (!firebasePdfResponse.ok) {
        throw new Error("Failed to fetch original PDF");
      }

      const firebasePdfBytes = await firebasePdfResponse.arrayBuffer();

      const mergedPdf = await PDFDocument.create();

      const generatedPdfDoc = await PDFDocument.load(generatedPdfBuffer);
      const firebasePdfDoc = await PDFDocument.load(firebasePdfBytes);

      const generatedPages = await mergedPdf.copyPages(
        generatedPdfDoc,
        generatedPdfDoc.getPageIndices()
      );

      generatedPages.forEach((page) => mergedPdf.addPage(page));

      const firebasePages = await mergedPdf.copyPages(
        firebasePdfDoc,
        firebasePdfDoc.getPageIndices()
      );

      firebasePages.forEach((page) => mergedPdf.addPage(page));

      finalPdfBytes = await mergedPdf.save();
    }

    const fileName = getQuotationFileName(data);

    // Mobile response
    if (format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: Buffer.from(finalPdfBytes).toString("base64"),
      });
    }

    // Web response
    return new Response(Buffer.from(finalPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Quotation PDF generation failed:", error);

    return Response.json(
      { message: "Failed to generate quotation PDF" },
      { status: 500 }
    );
  }
}

function getQuotationFileName(data: any) {
  let normalName = data?.customer_name || "Quotation";

  const nameParts = normalName.trim().split(/\s+/);

  if (nameParts.length > 2) {
    normalName = nameParts.slice(0, 2).join(" ");
  }

  const fileName = `${normalName} ${data?.contact_person || ""}-${data?.machine_model || ""}-${data?.machine_power || ""}-${data?.payment_terms || ""}${formatPrice(data?.price)}.pdf`;

  return cleanFileName(fileName);
}

function formatPrice(price: any) {
  if (!price) return "";

  const number = Number(String(price).replace(/[^\d.]/g, ""));

  if (Number.isNaN(number)) {
    return String(price);
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(number);
}

function cleanFileName(name: string) {
  return name
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
