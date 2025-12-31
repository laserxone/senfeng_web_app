import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";

const exportToExcel = async (
  headers,
  data,
  fileName = "data.xlsx",
  formatBuyingPrice = false,
  baseStorage = "",
  image = false
) => {
  if (!data || data.length === 0) {
    throw new Error("No data available to export");
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



  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 50 }, // Image column
  ];

  if (formatBuyingPrice) {
    for (let rowIndex = 1; rowIndex < worksheetData.length; rowIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 3 });
      const cell = worksheet[cellAddress];
      if (cell && !isNaN(cell.v)) {
        cell.t = 'n';
        cell.z = '¥#,##0.00';
        cell.v = parseFloat(cell.v);
      }
    }
  }

  try {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(excelBlob, fileName);
  } catch (error) {
    console.error("Failed to generate or download Excel:", error);
    throw new Error("Failed to generate Excel file");
  }
};



export default exportToExcel;
