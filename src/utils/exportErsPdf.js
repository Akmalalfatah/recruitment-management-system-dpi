import jsPDF from "jspdf";
import logoDpi from "../assets/logo_dpi.png";
import { loadImage, imageToDataUrl } from "./loadImage";

// Generates a PDF that visually replicates PT. Dana Purna Investama's
// official "ERS (Employee Requisition Sheet)" paper form -- logo level
// with the title, form-number box, DIVISI/ISSUED DATE/NOMOR ERS, the
// "DETIL ERS" grid, the PERSYARATAN JABATAN mini-table, the four-column
// signature block, and the PETUNJUK instructions.
// Layout reference: FM/HR/02.1, Revisi 0, Tgl. Terbit 21-05-2021.

const PAGE_W = 595.28; // A4 pt
const MARGIN_X = 40;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const INK = [20, 20, 20];
const LABEL_INK = [40, 40, 40];
const MUTED = [110, 110, 110];
// The scanned form is essentially black-on-white -- the ONLY colour on the
// whole page is the cyan "AREA PROJECT (ON SITE)" tag. Everything else
// (including the DETIL ERS divider) stays plain white with black rules,
// deliberately -- no grey fills anywhere else.
const BADGE_FILL = [178, 235, 242];

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function dateParts(str) {
  const m = String(str || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: m[1], mo: m[2], d: m[3] } : null;
}

function formatIssuedDate(str) {
  const p = dateParts(str) || dateParts(new Date().toISOString());
  if (!p) return "-";
  return `${p.d} ${MONTHS_ID[parseInt(p.mo, 10) - 1]} ${p.y}`;
}

function formatDMY(str) {
  const p = dateParts(str);
  return p ? `${p.d}/${p.mo}/${p.y}` : "-";
}

function formatTimestamp(str) {
  if (!str) return "";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}:${ss}`;
}

function sanitizeFilePart(str) {
  // Strip only characters that are actually illegal in filenames; keep
  // spaces, dashes, dots and parentheses since the requested filename
  // pattern relies on them.
  return String(str || "-").replace(/[\\/:*?"<>|]/g, "-");
}

// ---- low-level drawing helpers --------------------------------------------

function box(doc, x, y, w, h, { fill } = {}) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.75);
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, "FD");
  } else {
    doc.rect(x, y, w, h, "S");
  }
}

function putText(doc, str, x, y, { size = 8, bold = false, align = "left", color = INK } = {}) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(str === null || str === undefined || str === "" ? "-" : String(str), x, y, { align });
}

// A "label | value" pair drawn as two bordered, vertically-centered, plain
// white cells side by side -- the recurring building block of the form.
function labelValueCell(doc, x, y, labelW, valueW, h, label, value, opts = {}) {
  const { labelSize = 7.5, valueSize = 8.5 } = opts;

  box(doc, x, y, labelW, h);
  box(doc, x + labelW, y, valueW, h);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(labelSize);
  doc.setTextColor(...LABEL_INK);
  const labelLines = doc.splitTextToSize(String(label || ""), labelW - 10);
  const llh = labelSize + 2;
  let ly = y + h / 2 - ((labelLines.length - 1) * llh) / 2 + labelSize / 2.8;
  labelLines.forEach((line) => {
    doc.text(line, x + 5, ly);
    ly += llh;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(valueSize);
  doc.setTextColor(...INK);
  const raw = value === undefined || value === null || value === "" ? "-" : String(value);
  const valueLines = doc.splitTextToSize(raw, valueW - 12);
  const vlh = valueSize + 2.5;
  let vy = y + h / 2 - ((valueLines.length - 1) * vlh) / 2 + valueSize / 2.8;
  valueLines.forEach((line) => {
    doc.text(line, x + labelW + 6, vy);
    vy += vlh;
  });
}

const PETUNJUK_DOKUMEN = [
  "DOKUMEN YANG HARUS DILAMPIRKAN :",
  "1. JIKA PERMINTAAN BARU --> EMAIL DARI EPC (PKS, SPK)",
  "2. JIKA PENGURANGAN --> EMAIL DARI EPC (PKS, SPK)",
  "3. JIKA PENGGANTI RESIGN --> SURAT RESIGN",
  "4. JIKA PENGGANTI TIDAK ADA KABAR --> EMAIL PEMBERITAHUAN DARI PROJECT",
  "5. JIKA PENGGANTI HABIS KONTRAK --> SURAT BERAKHIR KONTRAK DARI HR ER",
  "6. JIKA PENGGANTI MUTASI/PROMOSI/DEMOSI --> SURAT MUTASI/PROMOSI/DEMOSI DARI HR ER",
  "7. JIKA PENGGANTI CUTI MELAHIRKAN -> SURAT CUTI MELAHIRKAN",
  "8. JIKA PENGGANTI / BACK UP TKAD KARENA COVID-19 -> BA KARANTINA TTD USER / HASIL TEST COVID-19 TKAD",
];

const PETUNJUK_SETELAH = [
  "SETELAH PENGISIAN :",
  "1. CETAK PDF YANG DIKIRIMKAN MELALUI EMAIL YANG DICANTUMKAN SAAT PENGISIAN.",
  "2. LENGKAPI TANDA-TANGAN YANG DIPERLUKAN :",
  "    - JIKA PERMINTAAN BARU             : DILENGKAPI SAMPAI KOLOM DIRECTOR",
  "    - JIKA PERMINTAAN PENGURANGAN  : DILENGKAPI SAMPAI KOLOM DIRECTOR",
  "    - JIKA PERMINTAAN PENGGANTI       : DILENGKAPI SAMPAI KOLOM DIVISION HEAD",
  "      (PENGGANTI RESIGN / TIDAK ADA KABAR, HABIS KONTRAK, MUTASI, PROMOSI, DEMOSI,",
  "       CUTI MELAHIRKAN, BACK UP TKAD KARENA COVID-19)",
  "3. JIKA SUDAH LENGKAP TANDA-TANGAN, SCAN DAN KIRIM EMAIL KE HR DIVISION HEAD",
];

export async function exportErsPdf(record) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const x0 = MARGIN_X;
  let y = 40;

  let logo = null;
  try {
    const img = await loadImage(logoDpi);
    logo = { dataUrl: imageToDataUrl(img), ratio: img.naturalWidth / img.naturalHeight };
  } catch {
    logo = null;
  }

  // ---------------- Header Row 1 ----------------
  const row1H = 46;
  const logoW = 110;
  const rightW = 145; // Diperlebar agar No Form lebih leluasa
  const midW = CONTENT_W - logoW - rightW;

  box(doc, x0, y, logoW, row1H);
  if (logo) {
    const imgH = 34;
    const imgW = imgH * logo.ratio;
    doc.addImage(logo.dataUrl, "PNG", x0 + (logoW - imgW) / 2, y + (row1H - imgH) / 2, imgW, imgH);
  } else {
    putText(doc, "PT. DANA PURNA", x0 + logoW / 2, y + row1H / 2 - 4, { align: "center", size: 20, bold: true });
    putText(doc, "INVESTAMA", x0 + logoW / 2, y + row1H / 2 + 7, { align: "center", size: 20, bold: true });
  }

  const midX = x0 + logoW;
  box(doc, midX, y, midW, row1H);
  putText(doc, "ERS", midX + midW / 2, y + row1H / 2 - 4, { align: "center", size: 20, bold: true });
  putText(doc, "(EMPLOYEE REQUISITION SHEET)", midX + midW / 2, y + row1H / 2 + 12, { align: "center", size: 9, bold: true });

  const rightX = midX + midW;
  box(doc, rightX, y, rightW, row1H);
  putText(doc, "No Form     : FM/HR/02.1", rightX + 8, y + row1H / 2 - 10, { size: 9 });
  putText(doc, "Revisi         : 0", rightX + 8, y + row1H / 2 + 2, { size: 9 });
  putText(doc, "Tgl. Terbit   : 21-05-2021", rightX + 8, y + row1H / 2 + 14, { size: 9 });

  y += row1H;

  // ---------------- Header Row 2-4 ----------------
  const subRowH = 20;
  const labelW2 = 110;
  const badgeW = rightW; 
  const valueW2 = CONTENT_W - labelW2 - badgeW;

  labelValueCell(doc, x0, y, labelW2, valueW2, subRowH, "DIVISI", record.divisi);
  labelValueCell(doc, x0, y + subRowH, labelW2, valueW2, subRowH, "ISSUED DATE", formatIssuedDate(record.created_at));
  labelValueCell(doc, x0, y + subRowH * 2, labelW2, valueW2, subRowH, "NOMOR ERS", record.nomor_ers);

  const badgeX = x0 + labelW2 + valueW2;
  box(doc, badgeX, y, badgeW, subRowH * 3, { fill: BADGE_FILL });
  putText(doc, "AREA PROJECT", badgeX + badgeW / 2, y + (subRowH * 3) / 2 - 3, { align: "center", size: 9.5, bold: true });
  putText(doc, "(ON SITE)", badgeX + badgeW / 2, y + (subRowH * 3) / 2 + 9, { align: "center", size: 9.5, bold: true });

  y += subRowH * 3;

  // ---------------- "DETIL ERS" section ----------------
  const sectionH = 20;
  box(doc, x0, y, CONTENT_W, sectionH); // Murni hitam-putih sesuai kode asli Anda
  putText(doc, "DETIL ERS", x0 + CONTENT_W / 2, y + 13.5, { align: "center", size: 9.5, bold: true });
  y += sectionH;

  // Mengatur layout lebar kolom agar proporsional 1/4 bagian layar
  const colLabelW = CONTENT_W / 4;
  const colValueW = CONTENT_W / 4;
  const col2X = x0 + CONTENT_W / 2;

  function row2(h, l1, v1, l2, v2) {
    labelValueCell(doc, x0, y, colLabelW, colValueW, h, l1, v1);
    labelValueCell(doc, col2X, y, colLabelW, colValueW, h, l2, v2);
    y += h;
  }

  row2(34, "ALASAN ERS", record.alasan_ers, "JENIS KONTRAK PROJECT", record.jenis_kontrak_project);
  row2(24, "JABATAN", record.jabatan, "WILAYAH PENEMPATAN KERJA", record.wilayah_penempatan_kerja);
  row2(40, "NAMA KARYAWAN YANG DIGANTI / DIKURANGI", record.nama_karyawan_existing, "LOKASI PENEMPATAN KERJA", record.area_penempatan);

  // ---------------- PERSYARATAN JABATAN ----------------
  const blockH = 96;
  const leftRowH = blockH / 3; 
  const rightHalfRowH = leftRowH / 2; 

  // Baris 1: Usia | Persyaratan Jabatan (Header)
  labelValueCell(doc, x0, y, colLabelW, colValueW, leftRowH, "USIA", record.usia);
  box(doc, col2X, y, colLabelW + colValueW, leftRowH);
  putText(doc, "PERSYARATAN JABATAN", col2X + (colLabelW + colValueW) / 2, y + 18, { align: "center", size: 9, bold: true });

  // Baris 2: Status | Kualifikasi (Atas) & Bahasa (Bawah)
  labelValueCell(doc, x0, y + leftRowH, colLabelW, colValueW, leftRowH, "STATUS", record.status_karyawan);
  labelValueCell(doc, col2X, y + leftRowH, colLabelW, colValueW, rightHalfRowH, "KUALIFIKASI", record.kualifikasi);
  labelValueCell(doc, col2X, y + leftRowH + rightHalfRowH, colLabelW, colValueW, rightHalfRowH, "BAHASA", record.bahasa);

  // Baris 3: Tanggal Aktif | Keahlian (Atas) & Sertifikat (Bawah)
  labelValueCell(doc, x0, y + leftRowH * 2, colLabelW, colValueW, leftRowH, "TANGGAL AKTIF YANG DIMINTA", formatDMY(record.tanggal_aktif_diminta));
  labelValueCell(doc, col2X, y + leftRowH * 2, colLabelW, colValueW, rightHalfRowH, "KEAHLIAN", record.keahlian);
  labelValueCell(doc, col2X, y + leftRowH * 2 + rightHalfRowH, colLabelW, colValueW, rightHalfRowH, "SERTIFIKAT", record.sertifikat);

  y += blockH;

  // ---------------- Signature block ----------------
  // Lebar kolom diatur sama (CONTENT_W / 4) sehingga sejajar sempurna dengan tabel atasnya
  const sigColW = CONTENT_W / 4;
  const sigHeaderH = 18;
  const sigSpaceH = 44;
  const sigNameH = 16;
  const sigRoleH = 16;

  // Mengambil 100% data persis dari kode yang Anda tempelkan
  const sigCols = [
    { title: "PEMOHON", role: "OPS / RO", name: record.pemohon_nama, ts: formatTimestamp(record.submitted_at) },
    { title: "DISETUJUI- 1", role: "DIVISION HEAD", name: record.disetujui_1_nama || "", ts: "" },
    { title: "DISETUJUI- 2", role: "DIRECTOR", name: record.disetujui_2_nama || "", ts: "" },
    { title: "DITERIMA", role: "HR DIVISION HEAD", name: record.diterima_nama || "", ts: "" },
  ];

  sigCols.forEach((c, i) => {
    const cx = x0 + sigColW * i;
    box(doc, cx, y, sigColW, sigHeaderH);
    putText(doc, c.title, cx + sigColW / 2, y + 12.5, { align: "center", size: 8, bold: true });
  });

  const ySpace = y + sigHeaderH;
  sigCols.forEach((c, i) => {
    const cx = x0 + sigColW * i;
    box(doc, cx, ySpace, sigColW, sigSpaceH);
    if (c.ts) putText(doc, c.ts, cx + sigColW / 2, ySpace + sigSpaceH - 7, { align: "center", size: 6.5, color: MUTED });
  });

  const yName = ySpace + sigSpaceH;
  sigCols.forEach((c, i) => {
    const cx = x0 + sigColW * i;
    box(doc, cx, yName, sigColW, sigNameH);
    putText(doc, c.name || "", cx + sigColW / 2, yName + 11.5, { align: "center", size: 8, bold: true });
  });

  const yRole = yName + sigNameH;
  sigCols.forEach((c, i) => {
    const cx = x0 + sigColW * i;
    box(doc, cx, yRole, sigColW, sigRoleH);
    putText(doc, c.role, cx + sigColW / 2, yRole + 11, { align: "center", size: 7.5, bold: true });
  });

  y = yRole + sigRoleH + 26;

  // ---------------- PETUNJUK footer ----------------
  putText(doc, "PETUNJUK :", x0, y, { size: 8.5, bold: true });
  y += 14;

  doc.setTextColor(40, 40, 40);
  PETUNJUK_DOKUMEN.forEach((line, i) => {
    doc.setFont("helvetica", i === 0 ? "bold" : "normal");
    doc.setFontSize(7.8);
    doc.text(line, x0, y + i * 11);
  });
  y += PETUNJUK_DOKUMEN.length * 11 + 10;

  PETUNJUK_SETELAH.forEach((line, i) => {
    doc.setFont("helvetica", i === 0 ? "bold" : "normal");
    doc.setFontSize(7.8);
    doc.text(line, x0, y + i * 11);
  });

  const seqPart = String(record.nomor_ers || "").split("/")[0] || "ERS";
  const lokasi = sanitizeFilePart(record.area_penempatan);
  const issued = formatIssuedDate(record.created_at);
  doc.save(`ERS.${seqPart}_${lokasi}(${issued}).pdf`);
}