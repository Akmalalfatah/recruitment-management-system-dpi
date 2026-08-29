import { useEffect, useRef, useState, useCallback } from "react";
import { IdCard as IdCardIcon, Download, Info, Upload, BadgeCheck, CheckCircle2, Printer } from "lucide-react";
import { idCardApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { renderIdCardCanvas, downloadIdCardPng, printIdCard } from "../../utils/exportIdCard";

export default function IdCardList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const previewRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    idCardApi
      .list({ dateFrom: range.from, dateTo: range.to })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  // Redraw the live ID card preview any time the active record or its
  // photo changes, so the person sees exactly what will be downloaded.
  useEffect(() => {
    if (!active || !previewRef.current) return;
    let cancelled = false;
    renderIdCardCanvas({
      name: active.nama_karyawan,
      employeeId: active.nomor_karyawan,
      jabatan: active.jabatan,
      photoDataUrl: active.photo_data_url,
    }).then((canvas) => {
      if (cancelled) return;
      const target = previewRef.current;
      if (!target) return;
      target.width = canvas.width;
      target.height = canvas.height;
      target.getContext("2d").drawImage(canvas, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  function openDetail(row) {
    setActive(row);
  }

  const hasPhoto = !!(active && active.photo_data_url);

  async function handleUploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const patch = { file_name: file.name, photo_data_url: dataUrl };
      if (active.status === "Pending") patch.status = "In Progress";
      await idCardApi.update(active.id, patch);
      const refreshed = await idCardApi.list({});
      setRows(refreshed);
      setActive((a) => (a ? { ...a, ...patch } : a));
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await downloadIdCardPng(active);
      await idCardApi.update(active.id, { status: "Completed" });
      const refreshed = await idCardApi.list({});
      setRows(refreshed);
      setActive((a) => (a ? { ...a, status: "Completed" } : a));
    } finally {
      setGenerating(false);
    }
  }

  async function handlePrint(record) {
    setPrinting(true);
    try {
      await printIdCard(record);
    } catch (err) {
      alert(err?.message || "Gagal mencetak ID Card.");
    } finally {
      setPrinting(false);
    }
  }

  const columns = [
    { key: "nama_karyawan", header: "Nama Karyawan" },
    { key: "nomor_karyawan", header: "No. Karyawan" },
    { key: "jabatan", header: "Jabatan" },
    { key: "tanggal_mulai", header: "Tgl Mulai" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <ActionIconButton icon={Info} onClick={() => openDetail(r)} variant="info" title="Lihat detail" />
          {r.status === "Completed" && (
            <ActionIconButton icon={Printer} onClick={() => handlePrint(r)} variant="edit" title="Cetak ID Card" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Training - ID Card" subtitle="Antrean pembuatan ID card untuk karyawan yang baru direkrut." />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <IdCardIcon size={16} className="text-primary" /> Antrean Pembuatan ID Card
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={() => exportToExcel(rows, "Antrean_ID_Card")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5"
            >
              <Download size={13} /> Ekspor Excel
            </button>
          </div>
        </div>
        {loading ? <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p> : <DataTable columns={columns} rows={rows} />}
      </Card>

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail ID Card" width="max-w-2xl">
        {active && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{active.nama_karyawan}</p>
                <p className="text-xs text-ink-500">
                  {active.jabatan} &middot; {active.nomor_karyawan}
                </p>
              </div>
              <StatusBadge status={active.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-5">
              <div className="flex justify-center sm:justify-start">
                <canvas
                  ref={previewRef}
                  className="w-[170px] h-auto border border-surface-border shadow-card rounded-[10px]"
                />
              </div>

              <div className="space-y-4 min-w-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[11px] font-medium text-ink-500 uppercase">Tanggal Mulai</p>
                    <p className="text-ink-900">{active.tanggal_mulai}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-ink-500 uppercase">Foto</p>
                    <p className="text-ink-900 truncate">{hasPhoto ? active.file_name : "Belum diunggah"}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border space-y-3">
                  {active.status === "Completed" ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-status-green/10 border border-status-green/30 px-3 py-2.5">
                        <CheckCircle2 size={16} />
                        ID Card sudah selesai dibuat untuk karyawan ini.
                      </div>
                      <div className="flex justify-end gap-2">
                        <GhostButton onClick={() => handlePrint(active)} disabled={printing}>
                          <Printer size={14} /> {printing ? "Menyiapkan..." : "Cetak"}
                        </GhostButton>
                        <PrimaryButton onClick={() => downloadIdCardPng(active)}>
                          <Download size={14} /> Download ID Card (PNG)
                        </PrimaryButton>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Proses Pembuatan ID Card</p>

                      <label className="flex items-center justify-between gap-3 border border-dashed border-surface-border px-3 py-3 cursor-pointer hover:bg-surface-panel transition-colors">
                        <span className="flex items-center gap-2 text-sm text-ink-700">
                          <Upload size={15} className="text-primary" />
                          {hasPhoto ? `Foto: ${active.file_name}` : "Unggah foto karyawan (JPG/PNG)"}
                        </span>
                        <span className="text-xs font-semibold text-primary shrink-0">
                          {uploading ? "Mengunggah..." : hasPhoto ? "Ganti Foto" : "Pilih File"}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} disabled={uploading} />
                      </label>

                      <div className="flex justify-end gap-2 pt-1">
                        <GhostButton onClick={() => setActive(null)}>Tutup</GhostButton>
                        <PrimaryButton onClick={handleGenerate} disabled={!hasPhoto || generating}>
                          <BadgeCheck size={14} /> {generating ? "Membuat ID Card..." : "Generate & Download ID Card"}
                        </PrimaryButton>
                      </div>
                      {!hasPhoto && (
                        <p className="text-[11px] text-ink-300">Unggah foto karyawan terlebih dahulu untuk mengaktifkan Generate ID Card.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
