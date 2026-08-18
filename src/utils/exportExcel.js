import * as XLSX from "xlsx";

// Exports an array of flat objects to a downloadable .xlsx file.
// All columns present in the data are included, per the client's request
// ("yang di ekspor seluruh kolom di excelnya").
export function exportToExcel(rows, fileName = "export") {
  const cleanRows = rows.map((row) => {
    const clean = {};
    Object.entries(row).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // flatten one level of nested objects (e.g. area: {...})
        Object.entries(value).forEach(([k2, v2]) => {
          clean[`${key}_${k2}`] = v2;
        });
      } else {
        clean[key] = value;
      }
    });
    return clean;
  });

  const worksheet = XLSX.utils.json_to_sheet(cleanRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
