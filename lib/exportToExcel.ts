import { storage } from "@/config/firebase";
import { saveAs } from "file-saver";
import { getDownloadURL, ref } from "firebase/storage";
import axios from "./axios";

const exportToExcel = async (
  headers: unknown[],
  data: unknown[][],
  fileName = "data.xlsx",
  formatBuyingPrice = false,
  baseStorage = "",
  image = false,
  userID: string | number | null = null,
) => {
  if (!data || data.length === 0) {
    throw new Error("No data available to export");
  }

  if (!userID) {
    throw new Error("User is missing");
  }

  const worksheetData = [headers];

  if (image) {
    for (const row of data) {
      const newRow = [...row];
      const refImage = row[4];

      if (refImage) {
        try {
          const starsRef = ref(storage, `${baseStorage}/${refImage}`);
          const url = await getDownloadURL(starsRef);
          newRow[4] = `=IMAGE("${url}", "", 0)`;
        } catch (err) {
          console.error(`Failed to load image for ${refImage}:`, err);
          newRow[4] = "Image not available";
        }
      } else {
        newRow[4] = "Image not available";
      }

      worksheetData.push(newRow);
    }
  } else {
    for (const row of data) {
      worksheetData.push(row);
    }
  }

  try {
    const PDFData = {
      worksheetData,
      formatBuyingPrice,
      fileName,
    };

    const pdfRes = await axios.post(
      `/${userID}/export-excel`,
      { data: PDFData },

      {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const blob = new Blob([pdfRes.data], {
      type: "application/pdf",
    });

    saveAs(blob, fileName);
  } catch (error) {
    console.error("Failed to generate or download Excel:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate Excel file");
  }
};

export default exportToExcel;
