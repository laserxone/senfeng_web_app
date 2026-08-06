import * as XLSX from "xlsx";

export const runtime = "nodejs";

type ExportRequest = {
  worksheetData?: unknown[][];
  formatBuyingPrice?: boolean;
  fileName?: string;
  format?: string;
};

export async function POST(request: Request) {
  try {
    const passingBody = await request.json();
    const body = passingBody?.data as ExportRequest;
    const { worksheetData, formatBuyingPrice = false } = body;

    if (!Array.isArray(worksheetData) || worksheetData.length < 2) {
      return Response.json(
        { message: "No data available to export" },
        { status: 400 },
      );
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 },
    ];

    if (formatBuyingPrice) {
      for (let rowIndex = 1; rowIndex < worksheetData.length; rowIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 3 });
        const cell = worksheet[cellAddress];

        if (cell && !Number.isNaN(Number(cell.v))) {
          cell.t = "n";
          cell.z = "¥#,##0.00";
          cell.v = Number.parseFloat(String(cell.v));
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    }) as Buffer;
    const fileName = cleanFileName(body.fileName);
    const mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (body.format === "base64") {
      return Response.json({
        fileName,
        mimeType,
        base64: Buffer.from(excelBuffer).toString("base64"),
      });
    }

    return new Response(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Excel generation failed:", error);

    return Response.json(
      { message: "Failed to generate Excel file" },
      { status: 500 },
    );
  }
}

function cleanFileName(fileName?: string) {
  const cleaned = (fileName || "data.xlsx")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.toLowerCase().endsWith(".xlsx") ? cleaned : `${cleaned}.xlsx`;
}

export const revalidate = 0;
