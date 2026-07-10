import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import DOPDFGatepass from "@/components/deliveries/do-pdf-gatepass";

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

    const deliveryDocument = React.createElement(DOPDFGatepass, {
      delivery_date: data.delivery_date,
      from: data.delivery_issued_by,
      vehicle_no: data.vehicle_no,
      driver_no: data.driver_number,
      driver_name: data.driver_name,
      received_by: data.to,
      order_no: data.order_no,
      manager: data.manager,
      gatepass: data.gate_pass,
      gatepassType: "Outward Gate Pass",
      time: data.tod,
      items: data.checklist,
    }) as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(deliveryDocument);
    const fileName = getDeliveryFileName(data);

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
    console.error("Delivery PDF generation failed:", error);

    return Response.json(
      { message: "Failed to generate delivery PDF" },
      { status: 500 }
    );
  }
}

function getDeliveryFileName(data: any) {
  const fileName = `${data?.gate_pass || "Delivery"}-${data?.order_no || "Gatepass"}.pdf`;

  return cleanFileName(fileName);
}

function cleanFileName(name: string) {
  return name
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
