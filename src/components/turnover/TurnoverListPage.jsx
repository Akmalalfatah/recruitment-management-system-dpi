import { useEffect, useState, useCallback } from "react";
import { Users, Download, Save, Info } from "lucide-react";
import { turnoverApi, interviewApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, TextArea, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import TurnoverDetailContent from "./TurnoverDetailContent";
import { exportTurnoverExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";

export default function TurnoverListPage({ heading, moduleLabel, variant = "area", editable = false, showCandidates = false, addButton = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [candidateDetail, setCandidateDetail] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    turnoverApi
      .list({ dateFrom: range.from, dateTo: range.to })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(row) {
    setActive(row);
    setDraftNote(row.keterangan_proses || "");
    setAssigned([]);
    if (showCandidates) {
      setAssignedLoading(true);
      interviewApi
        .list({})
        .then((all) => setAssigned(all.filter((i) => i.turnover_id === row.id)))
        .finally(() => setAssignedLoading(false));
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await turnoverApi.update(active.id, { keterangan_proses: draftNote });
      setActive(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  const baseColumns =
    variant === "area"
      ? [
          { key: "area_penempatan", header: "Area Penempatan" },
          { key: "jabatan", header: "Jabatan" },
          { key: "nama_karyawan_existing", header: "Karyawan Lama" },
        ]
      : [
          { key: "jabatan", header: "Jabatan" },
          { key: "nama_karyawan_existing", header: "Karyawan Keluar" },
          { key: "nama_karyawan_baru", header: "Karyawan Baru", render: (r) => r.nama_karyawan_baru || "-" },
        ];

  const columns = [
    ...baseColumns,
    { key: "nama_user", header: "Nama User", render: (r) => r.nama_user || "-" },
    { key: "tanggal_permintaan", header: "Tanggal Pengajuan", render: (r) => formatDate(r.tanggal_permintaan) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => <ActionIconButton icon={Info} onClick={() => openDetail(r)} variant="info" title="Lihat detail" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={heading}
        subtitle={`Data permintaan turnover untuk modul ${moduleLabel}.`}
        action={addButton && <PrimaryButton onClick={addButton.onClick}>{addButton.label}</PrimaryButton>}
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <Users size={16} className="text-primary" /> Daftar Turnover
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={() => exportTurnoverExcel(rows, "Daftar_Turnover")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
            >
              <Download size={13} /> Ekspor Excel
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail Turnover">
        <TurnoverDetailContent record={active} />

        {showCandidates && active && (
          <div className="mt-5 pt-4 border-t border-surface-border">
            <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-3">Peserta Diajukan</p>
            {assignedLoading ? (
              <p className="text-xs text-ink-500">Memuat peserta...</p>
            ) : assigned.length === 0 ? (
              <p className="text-xs text-ink-500">Belum ada peserta yang diajukan ke turnover ini.</p>
            ) : (
              <div className="space-y-2">
                {assigned.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCandidateDetail(c)}
                    className="w-full text-left border border-surface-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{c.nama_kandidat}</p>
                      <p className="text-[11px] text-ink-500">{c.posisi_yang_dilamar || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.hasil_interview || "-"} />
                      <StatusBadge status={c.hire_status || "-"} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {editable && active && (
          <div className="mt-5 pt-4 border-t border-surface-border space-y-3">
            <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Keterangan Proses</p>
            <div>
              <TextArea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Catatan proses..." />
              <p className="text-[11px] text-ink-300 mt-1">Status turnover hanya bisa diubah oleh Recruitment.</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <GhostButton onClick={() => setActive(null)}>Batal</GhostButton>
              <PrimaryButton onClick={saveChanges} disabled={saving}>
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!candidateDetail} onClose={() => setCandidateDetail(null)} title="Detail Peserta">
        {candidateDetail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{candidateDetail.nama_kandidat}</p>
                <p className="text-xs text-ink-500">{candidateDetail.posisi_yang_dilamar || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={candidateDetail.hasil_interview || "-"} />
                <StatusBadge status={candidateDetail.hire_status || "-"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CandidateField label="No. HP" value={candidateDetail.no_hp} />
              <CandidateField label="Domisili" value={candidateDetail.domisili} />
              <CandidateField label="Pendidikan" value={candidateDetail.pendidikan} />
              <CandidateField label="Jurusan" value={candidateDetail.jurusan} />
              <CandidateField label="Agama" value={candidateDetail.agama} />
              <CandidateField label="Tanggal Lahir" value={candidateDetail.tanggal_lahir} />
              <CandidateField label="Info Lowongan" value={candidateDetail.info_loker} />
              <CandidateField label="Referensi" value={candidateDetail.keterangan_referensi} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-500 uppercase mb-1">Keterangan Interview</p>
              <p className="text-ink-900">{candidateDetail.keterangan_interview || "-"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CandidateField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-500 uppercase">{label}</p>
      <p className="text-ink-900">{value || "-"}</p>
    </div>
  );
}
