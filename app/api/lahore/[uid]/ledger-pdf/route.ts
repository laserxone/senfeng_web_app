import React from "react";
import path from "path";
import { readFileSync } from "fs";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import InvoicePDF from "@/components/features/customers/components/invoicepdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const finalData = buildLedgerData(body);

    const logoSrc = {
      data: readFileSync(path.join(process.cwd(), "public", "logo.png")),
      format: "png" as const,
    };

    const pdfDocument = React.createElement(InvoicePDF, {
      data: finalData,
      logoSrc,
    }) as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfDocument);

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    const fileName = `ledger-${Date.now()}.pdf`;

    // For Expo React Native
    if (format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: pdfBuffer.toString("base64"),
      });
    }

    // For web browser
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);

    return Response.json(
      { message: "Failed to generate ledger PDF" },
      { status: 500 }
    );
  }
}

function buildLedgerData(body: any) {
  const total = Number(body?.total || 0);
  const received = Number(body?.received || 0);

  let runningBalance = total;

  const convertedPayment = (body?.payments || []).map((payment: any) => {
    runningBalance -= Number(payment?.amount || 0);

    return {
      ...payment,
      balance: runningBalance,
    };
  });

  return {
    customer: body?.data?.customer?.name,
    name: body?.data?.customer?.owner,
    contact: body?.data?.customer?.number?.join(", "),
    model: body?.data?.machine?.serial_no,
    serial: body?.data?.machine?.order_no_arr?.join(", "),
    manager: body?.data?.machine?.sell_by_name || "NA",
    payments: convertedPayment,
    received,
    total,
  };
}
