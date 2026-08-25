import { useEffect, useState, useCallback } from "react";
import { Users2, Download, Info, History } from "lucide-react";
import { interviewApi } from "../../lib/db";
import { PageHeader, Card, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";
import { KRITERIA_PENILAIAN } from "../../lib/constants";

// "Data Peserta Wawancara" is no longer a separate archive table -- it's
// interview_harian rows whose hasil_interview is Recommended or
// Considered (Not Recommended stays only in Interview Harian).
export default function CandidateList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [range, setRange] = useState({ from: "", to: "" });

  const load = useCallback(() => {
    setLoading(true);
    interviewApi
        .listHold({ dateFrom: range.from, dateTo: range.to })
      .then(setRows)
      .finally(() => setLoading(false));
      }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  // Same weighted formula as Interview Harian's edit screen -- keeps
  // "Total Nilai" consistent everywhere it's shown.
  const totalNilai = (r) => KRITERIA_PENILAIAN.reduce((sum, k) => sum + (Number(r[k.key]) || 0) * (k.bobot ?? 1), 0);

  function openDetail(row) {
    setActive(row);
    setHistoryLoading(true);
    interviewApi
      .history(row.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }

  const columns = [
    { key: "nama_kandidat", header: "Nama" },
    { key: "posisi_yang_dilamar", header: "Posisi Dilamar" },
    { key: "jurusan", header: "Jurusan", render: (r) => r.jurusan || "-" },
    { key: "domisili", header: "Domisili" },
    { key: "no_hp", header: "No. HP" },
    { key: "hasil_interview", header: "Hasil Interview", render: (r) => <StatusBadge status={r.hasil_interview || "-"} /> },
    { key: "total_nilai", header: "Total Nilai", render: (r) => totalNilai(r) },
    {
      key: "turnover",
      header: "Turnover Diajukan",
      render: (r) => r.turnover?.nomor_turnover || <span className="text-ink-300">Belum diajukan</span>,
    },
    {
      key: "hire_status",
      header: "Status Hired",
      render: (r) => <StatusBadge status={r.hire_status && r.hire_status !== "-" ? r.hire_status : "Belum Hired"} />,
    },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => <ActionIconButton icon={Info} onClick={() => openDetail(r)} variant="info" title="Lihat detail" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Data Peserta Wawancara"
        subtitle="Kandidat dengan hasil Recommended/Considered otomatis tampil di sini -- bisa diajukan ke turnover mana pun (kalau belum Hired) dari layar Turnover."
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <Users2 size={16} className="text-primary" /> Daftar Peserta Wawancara
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={() =>
                exportToExcel(
                  rows.map((r) => ({ ...r, turnover: undefined })),
                  "Data_Peserta_Wawancara"
                )
              }
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
            >
              <Download size={13} /> Ekspor Excel
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p>
        ) : (
          <DataTable columns={columns} rows={rows} emptyLabel="Belum ada peserta dengan hasil Recommended/Considered." />
        )}
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail Peserta Wawancara">
        {active && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{active.nama_kandidat}</p>
                <p className="text-xs text-ink-500">{active.posisi_yang_dilamar || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={active.hasil_interview || "-"} />
                <StatusBadge status={active.hire_status && active.hire_status !== "-" ? active.hire_status : "Belum Hired"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="No. HP" value={active.no_hp} />
              <DetailField label="Domisili" value={active.domisili} />
              <DetailField label="Pendidikan" value={active.pendidikan} />
              <DetailField label="Jurusan" value={active.jurusan} />
              <DetailField label="Agama" value={active.agama} />
              <DetailField label="Tanggal Lahir" value={active.tanggal_lahir} />
              <DetailField label="Info Lowongan" value={active.info_loker} />
              <DetailField label="Referensi" value={active.keterangan_referensi} />
              <DetailField label="Total Nilai" value={totalNilai(active)} />
              <DetailField label="Tanggal Interview" value={formatDate(active.tanggal_interview)} />
              <DetailField label="Turnover Diajukan Saat Ini" value={active.turnover?.nomor_turnover} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-500 uppercase mb-1">Keterangan Interview</p>
              <p className="text-ink-900">{active.keterangan_interview || "-"}</p>
            </div>

            <div className="pt-3 border-t border-surface-border">
              <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <History size={13} /> Riwayat Pengajuan Turnover
              </p>
              {historyLoading ? (
                <p className="text-xs text-ink-500">Memuat riwayat...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-ink-500">Belum pernah diajukan ke turnover manapun.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="border border-surface-border px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{h.turnover?.nomor_turnover || "-"}</p>
                        <p className="text-[11px] text-ink-500">
                          {h.turnover?.jabatan || "-"} — diajukan {formatDate(h.assigned_at)}
                          {h.unassigned_at ? ` s.d. ${formatDate(h.unassigned_at)}` : " (masih aktif)"}
                        </p>
                      </div>
                      <StatusBadge status={h.outcome || (h.unassigned_at ? "Dilepas" : "Masih Diajukan")} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-500 uppercase">{label}</p>
      <p className="text-ink-900">{value || "-"}</p>
    </div>
  );
}