import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const exportToExcel = (headers, data, fileName = "data.xlsx", formatBuyingPrice = false) => {
   if (!data || data.length === 0) {
    throw new Error("No data available to export");
  }

  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // If formatBuyingPrice is true, format the 4th column (index 3)
  if (formatBuyingPrice) {
    for (let rowIndex = 1; rowIndex <= data.length; rowIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 3 }); // column index 3 = 4th column
      const cell = worksheet[cellAddress];

      if (cell && !isNaN(cell.v)) {
        cell.t = 'n';
        cell.z = '¥#,##0.00'; // Chinese Yuan format
        cell.v = parseFloat(cell.v); // ensure it's a number
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const excelBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(excelBlob, fileName);
};


export default exportToExcel;
