import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Download, Plus, Pencil, Save, Info, Archive, Trash2 } from "lucide-react";
import { interviewApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, TextInput, SelectInput, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";
import { HASIL_INTERVIEW_LIST, KRITERIA_PENILAIAN } from "../../lib/constants";

// Interview harian is now independent of turnover -- hiring decisions are
// made from the Turnover edit screen (Recruitment > Turnover), not here.
// After scoring, this edit screen only decides whether the candidate is
// kept (Hold, visible on "Data Peserta Wawancara") or discarded entirely
// (Dibuang -- the row is deleted).
const KANDIDAT_STATUS_OPTIONS = ["Hold", "Dibuang"];

const emptyScores = { komunikasi: 3, penampilan: 3, pengetahuan_pekerjaan: 3, keterampilan: 3, pengalaman_kerja: 3 };

export default function InterviewList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);

  const [editRow, setEditRow] = useState(null);
  const [editScores, setEditScores] = useState(emptyScores);
  const [editHasil, setEditHasil] = useState("");
  const [editBanding, setEditBanding] = useState("");
  const [editKandidatStatus, setEditKandidatStatus] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    interviewApi
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

  function openEdit(row) {
    setEditRow(row);
    setEditScores({
      komunikasi: row.komunikasi ?? 3,
      penampilan: row.penampilan ?? 3,
      pengetahuan_pekerjaan: row.pengetahuan_pekerjaan ?? 3,
      keterampilan: row.keterampilan ?? 3,
      pengalaman_kerja: row.pengalaman_kerja ?? 3,
    });
    setEditHasil(row.hasil_interview || "");
    setEditBanding(row.keterangan_banding === "-" ? "" : row.keterangan_banding || "");
    setEditKandidatStatus(row.kandidat_status === "Hold" ? "Hold" : "");
  }

  async function saveEdit() {
    setSavingEdit(true);
    try {
      if (editKandidatStatus === "Dibuang") {
        const ok = window.confirm(
          `Buang data ${editRow.nama_kandidat}? Data interview ini akan dihapus permanen dan tidak akan muncul di Data Peserta Wawancara.`
        );
        if (!ok) {
          setSavingEdit(false);
          return;
        }
        await interviewApi.remove(editRow.id);
      } else {
        await interviewApi.update(editRow.id, {
          ...editScores,
          hasil_interview: editHasil || null,
          status: editHasil || "Pending",
          keterangan_banding: editBanding || "-",
          kandidat_status: editKandidatStatus === "Hold" ? "Hold" : "Pending",
        });
      }
      setEditRow(null);
      load();
    } finally {
      setSavingEdit(false);
    }
  }

  const columns = [
    { key: "tanggal_interview", header: "Tanggal Interview", render: (r) => formatDate(r.tanggal_interview) },
    { key: "nama_kandidat", header: "Nama Kandidat" },
    { key: "posisi_yang_dilamar", header: "Posisi Dilamar" },
    { key: "hasil_interview", header: "Hasil Interview", render: (r) => <StatusBadge status={r.hasil_interview || "-"} /> },
    {
      key: "kandidat_status",
      header: "Status Peserta",
      render: (r) => (r.kandidat_status === "Hold" ? <StatusBadge status="Hold" /> : <span className="text-ink-300">Belum diputuskan</span>),
    },
    {
      key: "turnover",
      header: "Turnover Terkait",
      render: (r) => r.turnover?.nomor_turnover || <span className="text-ink-300">Belum diajukan</span>,
    },
    { key: "hire_status", header: "Hired / Not Hired", render: (r) => <StatusBadge status={r.hire_status || "-"} /> },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <ActionIconButton icon={Info} onClick={() => openDetail(r)} variant="info" title="Lihat detail" />
          <ActionIconButton icon={Pencil} onClick={() => openEdit(r)} variant="edit" title="Edit nilai, hasil & status peserta" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Interview Harian"
        subtitle="Interview bisa dilakukan kapan saja, tidak perlu menunggu adanya turnover. Keputusan hired dilakukan dari layar Turnover."
        action={
          <PrimaryButton onClick={() => navigate("/recruitment/interview/new")}>
            <Plus size={15} /> Tambah Interview Baru
          </PrimaryButton>
        }
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <Users size={16} className="text-primary" /> Daftar Interview Harian
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={() => exportToExcel(rows.map((r) => ({ ...r, turnover: undefined })), "Interview_Harian")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
            >
              <Download size={13} /> Ekspor Excel
            </button>
          </div>
        </div>
        {loading ? <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p> : <DataTable columns={columns} rows={rows} />}
      </Card>

      {/* Read-only detail */}
      <Modal open={!!active} onClose={() => setActive(null)} title="Detail Interview Kandidat">
        {active && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{active.nama_kandidat}</p>
                <p className="text-xs text-ink-500">{active.posisi_yang_dilamar}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={active.hasil_interview || "-"} />
                <StatusBadge status={active.hire_status || "-"} />
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
              <DetailField
                label="Total Nilai"
                value={
                  (active.komunikasi || 0) +
                  (active.penampilan || 0) +
                  (active.pengetahuan_pekerjaan || 0) +
                  (active.keterampilan || 0) +
                  (active.pengalaman_kerja || 0)
                }
              />
              <DetailField label="Ajukan Banding" value={active.keterangan_banding} />
              <DetailField label="Turnover Terkait" value={active.turnover?.nomor_turnover} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-500 uppercase mb-1">Keterangan Interview</p>
              <p className="text-ink-900">{active.keterangan_interview || "-"}</p>
            </div>
            {active.kandidat_status === "Hold" && !active.turnover_id && (
              <div className="flex items-center gap-2 text-sm text-ink-700 bg-surface-panel border border-surface-border px-3 py-2.5">
                <Archive size={16} className="text-primary shrink-0" />
                Kandidat disimpan di pool "Data Peserta Wawancara" -- bisa diajukan ke turnover manapun yang
                cocok dari layar Turnover.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit: penilaian, hasil interview & keputusan hold/dibuang */}
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Nilai & Hasil Interview" width="max-w-lg">
        {editRow && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-ink-500 mb-1">Kandidat</p>
              <p className="text-sm font-semibold text-ink-900">{editRow.nama_kandidat}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-ink-900 mb-2">Aspek Penilaian</p>
              <div className="overflow-x-auto border border-surface-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-panel text-left text-ink-500 text-xs uppercase">
                      <th className="px-4 py-2">Kriteria</th>
                      <th className="px-4 py-2 w-32">Nilai (1-5)</th>
                      <th className="px-4 py-2 w-24">Bobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {KRITERIA_PENILAIAN.map((k, i) => (
                      <tr key={k.key}>
                        <td className="px-4 py-2">{i + 1}. {k.label}</td>
                        <td className="px-4 py-2">
                          <select
                            value={editScores[k.key]}
                            onChange={(e) => setEditScores((s) => ({ ...s, [k.key]: Number(e.target.value) }))}
                            className="w-full border border-surface-border px-2 py-1 text-sm"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-ink-500">{k.bobot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-right text-sm font-semibold text-ink-900 mt-2">
                Total Nilai: {KRITERIA_PENILAIAN.reduce((sum, k) => sum + (Number(editScores[k.key]) || 0) * (k.bobot ?? 1), 0)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Hasil Interview</label>
              <SelectInput value={editHasil} onChange={(e) => setEditHasil(e.target.value)} options={HASIL_INTERVIEW_LIST} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Ajukan Banding</label>
              <TextInput
                value={editBanding}
                onChange={(e) => setEditBanding(e.target.value)}
                placeholder="Keterangan banding (kosongkan jika tidak ada)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Status Peserta</label>
              <SelectInput
                value={editKandidatStatus}
                onChange={(e) => setEditKandidatStatus(e.target.value)}
                options={KANDIDAT_STATUS_OPTIONS}
                placeholder="Belum diputuskan"
              />
              <p className="text-[11px] text-ink-300 mt-1">
                <b>Hold</b>: kandidat disimpan ke "Data Peserta Wawancara" untuk kemungkinan diajukan ke turnover.{" "}
                <b>Dibuang</b>: data kandidat ini akan dihapus permanen.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setEditRow(null)}>Batal</GhostButton>
              <PrimaryButton onClick={saveEdit} disabled={savingEdit}>
                {editKandidatStatus === "Dibuang" ? <Trash2 size={14} /> : <Save size={14} />}
                {savingEdit ? "Menyimpan..." : editKandidatStatus === "Dibuang" ? "Buang Data" : "Simpan"}
              </PrimaryButton>
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
