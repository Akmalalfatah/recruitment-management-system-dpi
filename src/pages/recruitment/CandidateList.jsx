import { useEffect, useState, useCallback } from "react";
import { Users2, Download, Info, History } from "lucide-react";
import { candidatesApi } from "../../lib/db";
import { PageHeader, Card, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";

export default function CandidateList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    candidatesApi
      .list()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(row) {
    setActive(row);
    setHistoryLoading(true);
    try {
      const h = await candidatesApi.history(row.id);
      setHistory(h);
    } finally {
      setHistoryLoading(false);
    }
  }

  const totalNilai = (r) =>
    (r.komunikasi || 0) + (r.penampilan || 0) + (r.pengetahuan_pekerjaan || 0) + (r.keterampilan || 0) + (r.pengalaman_kerja || 0);

  const columns = [
    { key: "nama_kandidat", header: "Nama" },
    { key: "posisi_terakhir_dilamar", header: "Posisi Terakhir Dilamar" },
    { key: "domisili", header: "Domisili" },
    { key: "no_hp", header: "No. HP" },
    { key: "hasil_interview", header: "Hasil Interview Terakhir", render: (r) => <StatusBadge status={r.hasil_interview || "-"} /> },
    { key: "total_nilai", header: "Total Nilai", render: (r) => totalNilai(r) },
    { key: "updated_at", header: "Terakhir Diupdate", render: (r) => formatDate(r.updated_at) },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => <ActionIconButton icon={Info} onClick={() => openDetail(r)} variant="info" title="Lihat detail & riwayat" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Data Peserta Wawancara"
        subtitle="Kumpulan data pribadi, nilai, dan hasil peserta yang pernah diwawancara namun belum/tidak hired — bisa dipertimbangkan lagi untuk turnover dengan jabatan serupa."
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <Users2 size={16} className="text-primary" /> Daftar Peserta Wawancara
          </div>
          <button
            onClick={() => exportToExcel(rows, "Data_Peserta_Wawancara")}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
          >
            <Download size={13} /> Ekspor Excel
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            emptyLabel="Belum ada peserta yang ditandai Not Hired."
          />
        )}
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail Peserta Wawancara">
        {active && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{active.nama_kandidat}</p>
                <p className="text-xs text-ink-500">{active.posisi_terakhir_dilamar || "-"}</p>
              </div>
              <StatusBadge status={active.hasil_interview || "-"} />
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
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-500 uppercase mb-1">Keterangan Interview Terakhir</p>
              <p className="text-ink-900">{active.keterangan_interview || "-"}</p>
            </div>

            <div className="pt-4 border-t border-surface-border">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 uppercase tracking-wide mb-3">
                <History size={13} /> Riwayat Diseleksi di Turnover
              </p>
              {historyLoading ? (
                <p className="text-xs text-ink-500">Memuat riwayat...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-ink-500">Belum ada riwayat.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="border border-surface-border px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-xs font-semibold text-ink-900">
                          {h.turnover?.nomor_turnover || "-"} — {h.posisi_yang_dilamar || "-"}
                        </p>
                        <p className="text-[11px] text-ink-500">{formatDate(h.tanggal_interview)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={h.hasil_interview || "-"} />
                        <StatusBadge status={h.hire_status || "-"} />
                      </div>
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
