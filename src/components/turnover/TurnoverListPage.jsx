import { useEffect, useState, useCallback } from "react";
import { Users, Download, Save, Info } from "lucide-react";
import { turnoverApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, SelectInput, TextArea, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import TurnoverDetailContent from "./TurnoverDetailContent";
import { exportToExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";
import { TURNOVER_STATUS } from "../../lib/constants";

/**
 * variant: "area" -> columns show Area Penempatan / Jabatan / Karyawan Lama (OPS, Recruitment, Training)
 *          "swap"  -> columns show Jabatan / Karyawan Keluar / Karyawan Baru (ER, Payroll)
 * editable: when true (ER only) allows changing status + keterangan proses from the detail modal
 * addButton: { label, to } renders a "+" call-to-action (OPS only)
 */
export default function TurnoverListPage({ heading, moduleLabel, variant = "area", editable = false, addButton = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

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
    setDraftStatus(row.status);
    setDraftNote(row.keterangan_proses || "");
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await turnoverApi.updateStatus(active.id, draftStatus, { keterangan_proses: draftNote });
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
              onClick={() => exportToExcel(rows, "Daftar_Turnover")}
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

        {editable && active && (
          <div className="mt-5 pt-4 border-t border-surface-border space-y-3">
            <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Proses &amp; Keputusan</p>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Status</label>
              <SelectInput
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                options={Object.values(TURNOVER_STATUS)}
                placeholder="Pilih status"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Keterangan Proses</label>
              <TextArea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Catatan proses ER..." />
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
    </div>
  );
}
