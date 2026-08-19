import { useEffect, useState, useCallback } from "react";
import { Users2, Download, Info } from "lucide-react";
import { interviewApi } from "../../lib/db";
import { PageHeader, Card, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";

// "Data Peserta Wawancara" is no longer a separate archive table -- it's
// just interview_harian rows with kandidat_status = 'Hold', whether or not
// they're currently assigned to a turnover or already hired there.
export default function CandidateList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    interviewApi
      .listHold()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalNilai = (r) =>
    (r.komunikasi || 0) + (r.penampilan || 0) + (r.pengetahuan_pekerjaan || 0) + (r.keterampilan || 0) + (r.pengalaman_kerja || 0);

  const columns = [
    { key: "nama_kandidat", header: "Nama" },
    { key: "posisi_yang_dilamar", header: "Posisi Dilamar" },
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
      render: (r) => <ActionIconButton icon={Info} onClick={() => setActive(r)} variant="info" title="Lihat detail" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Data Peserta Wawancara"
        subtitle="Kumpulan data pribadi, nilai, dan hasil peserta yang disimpan (Hold) — bisa diajukan ke turnover mana pun dari layar Turnover, termasuk yang sudah hired."
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <Users2 size={16} className="text-primary" /> Daftar Peserta Wawancara
          </div>
          <button
            onClick={() => exportToExcel(rows.map((r) => ({ ...r, turnover: undefined })), "Data_Peserta_Wawancara")}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
          >
            <Download size={13} /> Ekspor Excel
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p>
        ) : (
          <DataTable columns={columns} rows={rows} emptyLabel="Belum ada peserta yang disimpan (Hold)." />
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
              <DetailField label="Turnover Diajukan" value={active.turnover?.nomor_turnover} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-500 uppercase mb-1">Keterangan Interview</p>
              <p className="text-ink-900">{active.keterangan_interview || "-"}</p>
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
