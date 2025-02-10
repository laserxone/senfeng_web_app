import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const exportToExcel = (headers, data, fileName="data.xlsx") => {
    if (!data || data.length === 0) {
        console.error("No data available to export");
        return;
    }

    const worksheetData = [headers, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(excelBlob, fileName);
};

export default exportToExcel;
