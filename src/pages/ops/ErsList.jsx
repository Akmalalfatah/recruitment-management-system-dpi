import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Download, FileDown, Info } from "lucide-react";
import { ersApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, ActionIconButton } from "../../components/common/Ui";
import { formatDate } from "../../utils/formatDate";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { exportErsPdf } from "../../utils/exportErsPdf";

// OPS can submit and track their own ERS here, but can NOT accept/reject
// it themselves — that decision belongs to Recruitment only
// (see /recruitment/ers). This screen is read-only for status.
export default function ErsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    ersApi
      .list({ dateFrom: range.from, dateTo: range.to })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  function openDetail(row) {
    setActive(row);
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
    { key: "created_at", header: "Tanggal Pengajuan", render: (r) => formatDate(r.created_at) },
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
        title="Operasional - Daftar ERS"
        subtitle="Arsip surat permohonan penggantian karyawan. Status diterima/ditolak ditentukan oleh Recruitment."
        action={
          <PrimaryButton onClick={() => navigate("/ops/ers/new")}>
            <Plus size={15} /> Tambah Pengajuan ERS
          </PrimaryButton>
        }
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
            </div>

            {active.status === "Pending" && (
              <p className="text-xs text-ink-500 mb-4">
                ERS ini sedang menunggu keputusan Recruitment (Accepted/Rejected). Turnover baru untuk permintaan ini
                baru bisa dibuat setelah ERS ini Accepted.
              </p>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 disabled:opacity-50"
            >
              <FileDown size={13} /> {downloading ? "Menyiapkan PDF..." : "Download ERS (PDF)"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
