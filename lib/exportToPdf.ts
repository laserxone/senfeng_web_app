import { saveAs } from "file-saver";
import axios from "./axios";

export default async function exportToPdf(
  headers: string[],
  rows: string[][],
  fileName = "Table-export.pdf",
  userID: string | number | null = null,
  total?: { columnName: string; value: number; displayValue: string } | null,
) {
  if (!headers.length || !rows.length) {
    throw new Error("No data available to export");
  }

  if (!userID) {
    throw new Error("User is missing");
  }

  const pdfData = {
    headers,
    rows,
    fileName,
    total,
  };

  try {
    const response = await axios.post(
      `/${userID}/export-pdf`,
      { data: pdfData },
      {
        responseType: "blob",
        headers: { "Content-Type": "application/json" },
      },
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    saveAs(blob, fileName);
  } catch (error) {
    console.error("Failed to generate or download PDF:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate PDF file");
  }
}
