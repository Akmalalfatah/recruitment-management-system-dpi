// Formats a "YYYY-MM-DD" (or any Date-parseable) value into a medium
// Indonesian date, e.g. "17 Agustus 2026". Returns "-" for empty/invalid input.
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDate(value) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}
