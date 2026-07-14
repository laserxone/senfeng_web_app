import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import InvoicePDF from "@/components/pos/invoicePDF";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body?.data;
    const format = body?.format;

    if (!data) {
      return Response.json(
        { message: "Delivery PDF data is required" },
        { status: 400 }
      );
    }

    const deliveryDocument = React.createElement(InvoicePDF, {
       companyName : data.companyName,
          name: data.name,
          phoneNumber: data.phoneNumber,
          address: data.address,
          manager: data.manager,
          nextInvoice: data.nextInvoice,
          selectedUser: data.selectedUser,
          invoiceItems: data.invoiceItems,
          totalAmount: data.totalAmount,
          warranty: data.warranty,
          warrantyYear: data.warrantyYear,
          discount: data.discount,
          createdAt : data.createdAt
    }) as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(deliveryDocument);
    const fileName = `${data.companyName}.pdf`;

    if (format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: Buffer.from(pdfBuffer).toString("base64"),
      });
    }

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PSD PDF generation failed:", error);

    return Response.json(
      { message: "Failed to generate delivery PDF" },
      { status: 500 }
    );
  }
}