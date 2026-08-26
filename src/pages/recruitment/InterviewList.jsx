import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Download, Plus, Pencil, Save, Info } from "lucide-react";
import { interviewApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, TextInput, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportToExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";
import { KRITERIA_PENILAIAN } from "../../lib/constants";

// Interview harian is now independent of turnover -- hiring decisions are
// made from the Turnover edit screen (Recruitment > Turnover), not here.
// There's no manual Hold/Dibuang choice anymore either: whether a
// candidate shows up on "Data Peserta Wawancara" is derived automatically
// from hasil_interview once it's set -- Recommended/Considered are kept,
// Not Recommended stays only in this list.
const emptyScores = { komunikasi: 3, penampilan: 3, pengetahuan_pekerjaan: 3, keterampilan: 3, pengalaman_kerja: 3 };

function totalNilai(scores) {
  return KRITERIA_PENILAIAN.reduce((sum, k) => sum + (Number(scores[k.key]) || 0) * (k.bobot ?? 1), 0);
}

// Hasil interview sekarang ditentukan otomatis dari total nilai (5 aspek x
// bobot 20, skala 100-500), bukan dipilih manual lagi:
//   >= 350        -> Recommended
//   250 - 349     -> Considered
//   < 250         -> Not Recommended
function computeHasilInterview(total) {
  if (total >= 350) return "Recommended";
  if (total >= 250) return "Considered";
  return "Not Recommended";
}

export default function InterviewList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });
  const [active, setActive] = useState(null);

  const [editRow, setEditRow] = useState(null);
  const [editScores, setEditScores] = useState(emptyScores);
  const [editBanding, setEditBanding] = useState("");
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
    setEditBanding(row.keterangan_banding === "-" ? "" : row.keterangan_banding || "");
  }

  async function saveEdit() {
    setSavingEdit(true);
    try {
      const hasil = computeHasilInterview(totalNilai(editScores));
      await interviewApi.update(editRow.id, {
        ...editScores,
        hasil_interview: hasil,
        status: hasil,
        keterangan_banding: editBanding || "-",
      });
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
    { key: "jurusan", header: "Jurusan", render: (r) => r.jurusan || "-" },
    { key: "hasil_interview", header: "Hasil Interview", render: (r) => <StatusBadge status={r.hasil_interview || "-"} /> },
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
          <ActionIconButton icon={Pencil} onClick={() => openEdit(r)} variant="edit" title="Edit nilai & hasil interview" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Interview Harian"
        subtitle="Catat dan nilai hasil interview kandidat."
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
              <DetailField label="Total Nilai" value={totalNilai(active)} />
              <DetailField label="Ajukan Banding" value={active.keterangan_banding} />
              <DetailField label="Turnover Terkait" value={active.turnover?.nomor_turnover} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-500 uppercase mb-1">Keterangan Interview</p>
              <p className="text-ink-900">{active.keterangan_interview || "-"}</p>
            </div>
            {(active.hasil_interview === "Recommended" || active.hasil_interview === "Considered") && !active.turnover_id && (
              <div className="flex items-center gap-2 text-sm text-ink-700 bg-surface-panel border border-surface-border px-3 py-2.5">
                <Info size={16} className="text-primary shrink-0" />
                Kandidat ini otomatis tampil di "Data Peserta Wawancara" -- bisa diajukan ke turnover manapun yang
                cocok dari layar Turnover.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit: penilaian & hasil interview */}
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
              <p className="text-right text-sm font-semibold text-ink-900 mt-2">Total Nilai: {totalNilai(editScores)}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Hasil Interview</label>
              <div className="flex items-center gap-2 border border-surface-border bg-surface-panel px-3 py-2">
                <StatusBadge status={computeHasilInterview(totalNilai(editScores))} />
                <span className="text-xs text-ink-500">(otomatis dari total nilai)</span>
              </div>
              <p className="text-[11px] text-ink-300 mt-1">
                <b>Recommended</b> &ge;350, <b>Considered</b> 250-349, <b>Not Recommended</b> &lt;250 -- otomatis
                mengikuti skala penilaian di atas, tidak dipilih manual. Recommended/Considered otomatis masuk ke
                "Data Peserta Wawancara".
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Ajukan Banding</label>
              <TextInput
                value={editBanding}
                onChange={(e) => setEditBanding(e.target.value)}
                placeholder="Keterangan banding (kosongkan jika tidak ada)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setEditRow(null)}>Batal</GhostButton>
              <PrimaryButton onClick={saveEdit} disabled={savingEdit}>
                <Save size={14} /> {savingEdit ? "Menyimpan..." : "Simpan"}
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