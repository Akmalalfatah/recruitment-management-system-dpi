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

// Fixed column order/labels for every turnover Excel export across the
// app (OPS, ER, Recruitment, Training, Payroll), per the client's
// requested layout. "NAMA CTKAD" is turnover.nama_karyawan_baru (the new
// hire's name) under that column title.
export function exportTurnoverExcel(rows, fileName = "Daftar_Turnover") {
  const mapped = rows.map((r) => ({
    "NO TURNOVER": r.nomor_turnover || "-",
    "NAMA KOORDINATOR": r.nama_koordinator || "-",
    "NAMA REKRUTER": r.nama_rekruter || "-",
    "NAMA AREA PENEMPATAN": r.area_penempatan || "-",
    "NAMA KARYAWAN EXISTING": r.nama_karyawan_existing || "-",
    JABATAN: r.jabatan || "-",
    "ALASAN KELUAR": r.alasan_keluar || "-",
    "TGL PERMINTAAN": r.tanggal_permintaan || "-",
    "TGL KELUAR": r.tanggal_keluar || "-",
    "TGL KIRIM KANDIDAT": r.tgl_kirim_kandidat || "-",
    "TGL INTERVIEW USER": r.tgl_interview_user || "-",
    "TGL PKWT": r.tgl_pkwt || "-",
    "TGL AKTIF KERJA": r.tgl_aktif_kerja || "-",
    "NAMA CTKAD": r.nama_karyawan_baru || "-",
    "NAMA USER": r.nama_user || "-",
    "KETERANGAN PROSES": r.keterangan_proses || "-",
    "STATUS PROSES": r.status || "-",
  }));
  const worksheet = XLSX.utils.json_to_sheet(mapped);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Turnover");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
