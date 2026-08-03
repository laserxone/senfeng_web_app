import InvoicePDFGatepass from "@/components/features/pos/invoice-pdf-gatepass"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import React from "react"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = body?.data
    const format = body?.format

    if (!data) {
      return Response.json(
        { message: "Delivery PDF data is required" },
        { status: 400 }
      )
    }

    const deliveryDocument = React.createElement(InvoicePDFGatepass, {
      from: data.from,
      vehicle_no: data.vehicle_no,
      driver_name: data.driver_name ?? "",
      received_by: data.received_by ?? "",
      manager: data.manager ?? "",
      gatepass: data.gatepass,
      gatepassType: "Outward Gate Pass",
      items: data.items,
      created_at: data.created_at,
    }) as React.ReactElement<DocumentProps>

    const pdfBuffer = await renderToBuffer(deliveryDocument)
    const fileName = `outward-gatepass.pdf`

    if (format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: Buffer.from(pdfBuffer).toString("base64"),
      })
    }

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("PSD PDF generation failed:", error)

    return Response.json(
      { message: "Failed to generate delivery PDF" },
      { status: 500 }
    )
  }
}
