import logoDpi from "../assets/logo_dpi.png";
import { loadImage } from "./loadImage";

// Renders the DPI employee ID card design: white card, DPI logo top-left,
// employee name + employee number, a large photo area, and a diagonal
// blue/orange ribbon across the bottom -- matching the physical lanyard
// card design used by PT. Dana Purna Investama.

const PRIMARY = "#3A64AF"; // brand blue, matches tailwind.config.js `primary`
const SECONDARY = "#F08321"; // brand orange, matches tailwind.config.js `secondary`
const INK = "#1C2333";
const MUTED = "#69708A";

const CARD_W = 400;
const CARD_H = 636; // portrait, close to a CR80 lanyard card ratio

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || "").split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
}

// Draws `img` into the x/y/w/h box using "cover" behaviour (crop to fill,
// preserving aspect ratio) -- same idea as CSS `object-fit: cover`.
function drawCover(ctx, img, x, y, w, h) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.naturalHeight;
    sw = sh * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export async function renderIdCardCanvas({ name, employeeId, jabatan, photoDataUrl }) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");

  // Card base + clip so nothing (photo, ribbon) draws outside the rounded corners.
  roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 22);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 22);
  ctx.clip();

  ctx.strokeStyle = "#E3E6EE";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2);

  // ---- Logo ----
  try {
    const logoImg = await loadImage(logoDpi);
    const logoW = 150;
    const logoH = logoW / (logoImg.naturalWidth / logoImg.naturalHeight);
    ctx.drawImage(logoImg, 28, 26, logoW, logoH);
  } catch {
    ctx.fillStyle = PRIMARY;
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText("DPI", 28, 55);
  }

  // ---- Name ----
  ctx.fillStyle = INK;
  ctx.font = "bold 26px Arial, sans-serif";
  const nameLines = wrapCanvasText(ctx, String(name || "-").toUpperCase(), CARD_W - 56).slice(0, 2);
  let nameY = 130;
  nameLines.forEach((line) => {
    ctx.fillText(line, 28, nameY);
    nameY += 30;
  });

  // ---- Employee number ----
  ctx.fillStyle = MUTED;
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(employeeId || "-", 28, nameY + 6);

  // ---- Photo ----
  const photoTop = nameY + 34;
  const photoH = CARD_H - photoTop - 74;
  const photoW = CARD_W - 56;
  const photoX = 28;

  ctx.save();
  roundRectPath(ctx, photoX, photoTop, photoW, photoH, 14);
  ctx.clip();
  ctx.fillStyle = "#EEF0F4";
  ctx.fillRect(photoX, photoTop, photoW, photoH);
  if (photoDataUrl) {
    try {
      const photoImg = await loadImage(photoDataUrl);
      drawCover(ctx, photoImg, photoX, photoTop, photoW, photoH);
    } catch {
      // keep the placeholder background if the photo fails to decode
    }
  } else {
    ctx.fillStyle = MUTED;
    ctx.font = "14px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Foto belum diunggah", photoX + photoW / 2, photoTop + photoH / 2);
    ctx.textAlign = "left";
  }
  ctx.restore();

  // ---- Bottom diagonal ribbon (brand blue + orange stripe) ----
  const ribbonBase = CARD_H - 70;
  ctx.fillStyle = PRIMARY;
  ctx.beginPath();
  ctx.moveTo(0, ribbonBase + 24);
  ctx.lineTo(CARD_W, ribbonBase - 10);
  ctx.lineTo(CARD_W, CARD_H);
  ctx.lineTo(0, CARD_H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SECONDARY;
  ctx.beginPath();
  ctx.moveTo(0, ribbonBase + 24);
  ctx.lineTo(CARD_W, ribbonBase - 10);
  ctx.lineTo(CARD_W, ribbonBase + 6);
  ctx.lineTo(0, ribbonBase + 46);
  ctx.closePath();
  ctx.fill();

  if (jabatan) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(jabatan).toUpperCase(), CARD_W / 2, CARD_H - 20);
    ctx.textAlign = "left";
  }

  ctx.restore(); // outer rounded-corner clip
  return canvas;
}

export async function downloadIdCardPng(record) {
  const canvas = await renderIdCardCanvas({
    name: record.nama_karyawan,
    employeeId: record.nomor_karyawan,
    jabatan: record.jabatan,
    photoDataUrl: record.photo_data_url,
  });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  const safeName = String(record.nama_karyawan || "Karyawan").replace(/\s+/g, "_");
  a.download = `IDCard_${record.nomor_karyawan || safeName}.png`;
  a.click();
}
