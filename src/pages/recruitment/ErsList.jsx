import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Save, FileDown, Info } from "lucide-react";
import { ersApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, SelectInput, ActionIconButton } from "../../components/common/Ui";
import { formatDate } from "../../utils/formatDate";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { exportErsPdf } from "../../utils/exportErsPdf";
import { ERS_STATUS } from "../../lib/constants";

// Recruitment's ERS review screen: this is the ONLY place an ERS can be
// Accepted/Rejected. OPS submits the ERS but can't accept its own
// submission (see /ops/ers, which is read-only for status).
export default function RecruitmentErsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    ersApi
      .list({ dateFrom: range.from, dateTo: range.to })
      // Once accepted, an ERS has already done its job (its turnover was
      // auto-created) -- Recruitment doesn't need to keep seeing it here.
      .then((all) => setRows(all.filter((r) => r.status !== "Accepted")))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(row) {
    setActive(row);
    setDraftStatus(row.status);
  }

  async function saveStatus() {
    setSaving(true);
    try {
      await ersApi.updateStatus(active.id, draftStatus);
      setActive(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await exportErsPdf(active);
    } finally {
      setDownloading(false);
    }
  }

  const columns = [
    { key: "nomor_ers", header: "Nomor ERS" },
    { key: "jabatan", header: "Jabatan" },
    { key: "area_penempatan", header: "Lokasi Penempatan" },
    { key: "pemohon_nama", header: "Pemohon" },
    { key: "created_at", header: "Tanggal Pengajuan", render: (r) => formatDate(r.created_at) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => <ActionIconButton icon={Info} onClick={() => openDetail(r)} variant="info" title="Lihat & proses ERS" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Review ERS"
        subtitle="Terima atau tolak pengajuan ERS dari Operasional. Turnover dibuat otomatis begitu ERS di-Accept, dan ERS yang sudah Accepted otomatis hilang dari daftar ini."
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <FileText size={16} className="text-primary" /> Daftar ERS
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={() => exportToExcel(rows, "Daftar_ERS")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
            >
              <Download size={13} /> Ekspor Excel
            </button>
          </div>
        </div>
        {loading ? <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p> : <DataTable columns={columns} rows={rows} />}
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail ERS">
        {active && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-ink-900">{active.nomor_ers}</p>
                <p className="text-xs text-ink-500">{active.area_penempatan || "-"}</p>
              </div>
              <StatusBadge status={active.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              <div>
                <p className="text-[11px] font-medium text-ink-500 uppercase">Jabatan</p>
                <p className="text-ink-900">{active.jabatan || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-500 uppercase">Lokasi Penempatan Kerja</p>
                <p className="text-ink-900">{active.area_penempatan || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-500 uppercase">Nama Karyawan Diganti</p>
                <p className="text-ink-900">{active.nama_karyawan_existing || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-500 uppercase">Tanggal Pengajuan</p>
                <p className="text-ink-900">{formatDate(active.created_at) || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-500 uppercase">Pemohon</p>
                <p className="text-ink-900">{active.pemohon_nama || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-ink-500 uppercase">Alasan ERS</p>
                <p className="text-ink-900">{active.alasan_ers || "-"}</p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 mb-5 disabled:opacity-50"
            >
              <FileDown size={13} /> {downloading ? "Menyiapkan PDF..." : "Download ERS (PDF)"}
            </button>

            {active.status === "Pending" ? (
              <div className="pt-4 border-t border-surface-border space-y-3">
                <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Terima / Tolak ERS</p>
                <SelectInput
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                  options={Object.values(ERS_STATUS)}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <GhostButton onClick={() => setActive(null)}>Batal</GhostButton>
                  <PrimaryButton onClick={saveStatus} disabled={saving}>
                    <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-surface-border">
                <p className="text-xs text-ink-500">
                  ERS ini sudah <b>{active.status}</b> dan tidak bisa diubah lagi.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
