import { useEffect, useState, useCallback } from "react";
import { Users, Download, Pencil, Save, UserCheck, UserMinus, UserPlus, CheckCircle2, Search } from "lucide-react";
import { turnoverApi, interviewApi, idCardApi } from "../../lib/db";
import { PageHeader, Card, PrimaryButton, GhostButton, TextInput, SelectInput, TextArea, ActionIconButton } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import DateRangeFilter from "../../components/common/DateRangeFilter";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { exportTurnoverExcel } from "../../utils/exportExcel";
import { formatDate } from "../../utils/formatDate";
import { TURNOVER_STATUS_LIST, TURNOVER_STATUS_TERPILIH } from "../../lib/constants";
import { useAuth } from "../../contexts/AuthContext";

const emptyDraft = {
  status: "",
  nama_rekruter: "",
  nama_koordinator: "",
  tgl_kirim_kandidat: "",
  tgl_interview_user: "",
  tgl_pkwt: "",
  tgl_aktif_kerja: "",
  keterangan_proses: "",
};

const emptySourcing = {
  nama_kandidat: "",
};

export default function RecruitmentTurnoverList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: "", to: "" });

  const [active, setActive] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [pool, setPool] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showSourcing, setShowSourcing] = useState(false);
  const [sourcingForm, setSourcingForm] = useState(emptySourcing);

  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null); // interview id currently being assigned/unassigned/hired
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

  async function loadDetail(turnoverId) {
    setDetailLoading(true);
    try {
      const [allInterviews, poolList] = await Promise.all([interviewApi.list({}), interviewApi.listAvailablePool()]);
      setAssigned(allInterviews.filter((i) => i.turnover_id === turnoverId));
      setPool(poolList);
    } finally {
      setDetailLoading(false);
    }
  }

  function openDetail(row) {
    setActive(row);
    setShowPicker(false);
    setShowSourcing(false);
    setSourcingForm(emptySourcing);
    setDraft({
      status: row.status || "",
      // Belum pernah diisi -> otomatis pakai nama Recruitment yang sedang
      // login (masih bisa diganti manual kalau turnover ini ditangani
      // rekruter lain).
      nama_rekruter: row.nama_rekruter || user?.name || "",
      nama_koordinator: row.nama_koordinator || "",
      tgl_kirim_kandidat: row.tgl_kirim_kandidat || "",
      tgl_interview_user: row.tgl_interview_user || "",
      tgl_pkwt: row.tgl_pkwt || "",
      tgl_aktif_kerja: row.tgl_aktif_kerja || "",
      keterangan_proses: row.keterangan_proses || "",
    });
    loadDetail(row.id);
  }

  function closeDetail() {
    setActive(null);
    setAssigned([]);
    setPool([]);
    setShowPicker(false);
    setShowSourcing(false);
    setSourcingForm(emptySourcing);
  }

  async function refreshActive() {
    const fresh = await turnoverApi.get(active.id);
    setActive(fresh);
    load();
    return fresh;
  }

  async function saveDraft() {
    setSaving(true);
    try {
      await turnoverApi.update(active.id, draft);
      await refreshActive();
    } finally {
      setSaving(false);
    }
  }

  async function assignCandidate(interviewId) {
    setBusyId(interviewId);
    try {
      await interviewApi.assignToTurnover(interviewId, active.id);
      await loadDetail(active.id);
    } catch (err) {
      alert(err?.message || "Gagal mengajukan peserta.");
    } finally {
      setBusyId(null);
    }
  }

  async function unassignCandidate(interviewId) {
    setBusyId(interviewId);
    try {
      await interviewApi.assignToTurnover(interviewId, null);
      await loadDetail(active.id);
    } finally {
      setBusyId(null);
    }
  }

  async function markHired(interview) {
    const ok = window.confirm(
      `Tandai "${interview.nama_kandidat}" sebagai Hired?\n\nTurnover ini akan otomatis ditandai selesai, peserta lain yang diajukan otomatis Not Hired, dan proses ID Card akan mulai di modul Training.`
    );
    if (!ok) return;
    setBusyId(interview.id);
    try {
      await interviewApi.update(interview.id, { hire_status: "Hired" });
      await idCardApi.createFromInterview(interview.id);
      await loadDetail(active.id);
      await refreshActive();
    } finally {
      setBusyId(null);
    }
  }

  const isClosed = active?.status === TURNOVER_STATUS_TERPILIH;
  const sourcingMatches = sourcingForm.nama_kandidat.trim()
    ? pool.filter((candidate) => candidate.nama_kandidat?.toLowerCase().includes(sourcingForm.nama_kandidat.trim().toLowerCase()))
    : [];

  const columns = [
    { key: "area_penempatan", header: "Area Penempatan" },
    { key: "jabatan", header: "Jabatan" },
    { key: "nama_karyawan_existing", header: "Karyawan Lama" },
    { key: "nama_karyawan_baru", header: "Karyawan Baru", render: (r) => r.nama_karyawan_baru || "-" },
    { key: "nama_rekruter", header: "Nama Rekruter", render: (r) => r.nama_rekruter || "-" },
    { key: "tanggal_permintaan", header: "Tanggal Pengajuan", render: (r) => formatDate(r.tanggal_permintaan) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => <ActionIconButton icon={Pencil} onClick={() => openDetail(r)} variant="edit" title="Kelola turnover" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment - Turnover"
        subtitle="Turnover dibuat otomatis saat ERS di-Accept. Kelola tanggal proses, ajukan peserta, dan tandai hired dari sini."
      />
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm">
            <Users size={16} className="text-primary" /> Daftar Turnover
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangeFilter from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={() => exportTurnoverExcel(rows, "Daftar_Turnover_Recruitment")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 "
            >
              <Download size={13} /> Ekspor Excel
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p>
        ) : (
          <DataTable columns={columns} rows={rows} emptyLabel="Belum ada turnover. Turnover terbuat otomatis saat ERS di-Accept." />
        )}
      </Card>

      <Modal open={!!active} onClose={closeDetail} title="Kelola Turnover" width="max-w-3xl">
        {active && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-900">{active.nomor_turnover}</p>
                <p className="text-xs text-ink-500">
                  {active.jabatan} — {active.area_penempatan || "-"}
                </p>
              </div>
              <StatusBadge status={active.status} />
            </div>

            {/* Diambil otomatis dari ERS sumbernya -- sudah diisi OPS waktu
                bikin ERS, jadi tidak perlu diisi ulang manual di sini. */}
            <div className="grid grid-cols-2 gap-4 bg-surface-100/60 border border-surface-border px-3 py-2.5 text-xs">
              <div>
                <p className="text-ink-500 font-medium mb-0.5">Alasan Keluar</p>
                <p className="text-ink-900 font-semibold">{active.alasan_keluar || "-"}</p>
              </div>
              <div>
                <p className="text-ink-500 font-medium mb-0.5">Tanggal Keluar</p>
                <p className="text-ink-900 font-semibold">{formatDate(active.tanggal_keluar) || "-"}</p>
              </div>
            </div>

            {isClosed && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-status-green/10 border border-status-green/30 px-3 py-2.5">
                <CheckCircle2 size={16} className="shrink-0" />
                Turnover selesai. Karyawan baru: <b>{active.nama_karyawan_baru}</b>. Proses ID Card sudah berjalan di
                modul Training.
              </div>
            )}

            {/* ---- Editable process fields ---- */}
            <div>
              <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-3">Data &amp; Tanggal Proses</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Status Turnover</label>
                  <SelectInput
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                    options={TURNOVER_STATUS_LIST}
                    disabled={isClosed}
                  />
                  <p className="text-[11px] text-ink-300 mt-1">
                    {isClosed
                      ? "Turnover ini sudah Terpilih (selesai) -- status tidak bisa diubah lagi."
                      : '"Terpilih" otomatis ter-set saat kandidat ditandai Hired -- tidak perlu dipilih manual.'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Nama Rekruter</label>
                  <TextInput value={draft.nama_rekruter} onChange={(e) => setDraft((d) => ({ ...d, nama_rekruter: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Nama Koordinator</label>
                  <TextInput value={draft.nama_koordinator} onChange={(e) => setDraft((d) => ({ ...d, nama_koordinator: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Tgl Kirim Kandidat</label>
                  <TextInput type="date" value={draft.tgl_kirim_kandidat} onChange={(e) => setDraft((d) => ({ ...d, tgl_kirim_kandidat: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Tgl Interview User</label>
                  <TextInput type="date" value={draft.tgl_interview_user} onChange={(e) => setDraft((d) => ({ ...d, tgl_interview_user: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Tgl PKWT</label>
                  <TextInput type="date" value={draft.tgl_pkwt} onChange={(e) => setDraft((d) => ({ ...d, tgl_pkwt: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Tgl Aktif Kerja</label>
                  <TextInput type="date" value={draft.tgl_aktif_kerja} onChange={(e) => setDraft((d) => ({ ...d, tgl_aktif_kerja: e.target.value }))} />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-ink-500 mb-1">Keterangan Proses</label>
                <TextArea value={draft.keterangan_proses} onChange={(e) => setDraft((d) => ({ ...d, keterangan_proses: e.target.value }))} placeholder="Catatan proses rekrutmen..." />
              </div>
              <div className="flex justify-end pt-3">
                <PrimaryButton onClick={saveDraft} disabled={saving}>
                  <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </PrimaryButton>
              </div>
            </div>

            {/* ---- Assigned candidates ---- */}
            <div className="pt-4 border-t border-surface-border">
              <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide mb-3">Peserta Diajukan</p>
              {detailLoading ? (
                <p className="text-xs text-ink-500">Memuat peserta...</p>
              ) : assigned.length === 0 ? (
                <p className="text-xs text-ink-500">Belum ada peserta yang diajukan ke turnover ini.</p>
              ) : (
                <div className="space-y-2">
                  {assigned.map((c) => (
                    <div key={c.id} className="border border-surface-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCandidateDetail(c)}
                        className="text-left flex-1 min-w-[120px] hover:opacity-70 transition-opacity"
                        title="Lihat detail peserta"
                      >
                        <p className="text-sm font-semibold text-ink-900">{c.nama_kandidat}</p>
                        <p className="text-[11px] text-ink-500">{c.posisi_yang_dilamar || "-"}</p>
                      </button>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={c.hasil_interview || "-"} />
                        <StatusBadge status={c.hire_status || "-"} />
                        {c.hire_status !== "Hired" && !isClosed && (
                          <>
                            <GhostButton onClick={() => unassignCandidate(c.id)} disabled={busyId === c.id} className="text-xs px-2.5 py-1.5">
                              <UserMinus size={13} /> Lepas
                            </GhostButton>
                            <PrimaryButton onClick={() => markHired(c)} disabled={busyId === c.id} className="text-xs px-2.5 py-1.5">
                              <UserCheck size={13} /> Tandai Hired
                            </PrimaryButton>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---- Pick more candidates from the pool, or source new ones directly ---- */}
            <div className="pt-4 border-t border-surface-border">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Pilih Peserta dari Data Peserta Wawancara</p>
                {!isClosed && (
                  <div className="flex items-center gap-2">
                    <GhostButton
                      onClick={() => {
                        setShowSourcing((s) => !s);
                        setShowPicker(false);
                      }}
                      className="text-xs px-2.5 py-1.5"
                    >
                      <Search size={13} /> {showSourcing ? "Tutup" : "Sourcing"}
                    </GhostButton>
                    <GhostButton
                      onClick={() => {
                        setShowPicker((s) => !s);
                        setShowSourcing(false);
                      }}
                      className="text-xs px-2.5 py-1.5"
                    >
                      <UserPlus size={13} /> {showPicker ? "Tutup" : "Pilih Peserta"}
                    </GhostButton>
                  </div>
                )}
              </div>

              {!isClosed && showSourcing && (
                <div className="space-y-3 mb-4 bg-surface-panel border border-surface-border px-3 py-3">
                  <div>
                    <TextInput
                      placeholder="Nama Kandidat"
                      value={sourcingForm.nama_kandidat}
                      onChange={(e) => setSourcingForm((f) => ({ ...f, nama_kandidat: e.target.value }))}
                      required
                    />
                    {sourcingMatches.length > 0 && (
                      <div className="mt-2 border border-surface-border divide-y divide-surface-border">
                        {sourcingMatches.map((candidate) => (
                          <div key={candidate.id} className="flex items-center justify-between gap-3 px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-ink-900">{candidate.nama_kandidat}</p>
                              <p className="text-[11px] text-ink-500">{candidate.posisi_yang_dilamar || "-"}</p>
                            </div>
                            <PrimaryButton
                              type="button"
                              onClick={() => assignCandidate(candidate.id)}
                              disabled={busyId === candidate.id}
                              className="text-xs px-2.5 py-1.5"
                            >
                              <UserPlus size={13} /> {busyId === candidate.id ? "Memproses..." : "Ajukan"}
                            </PrimaryButton>
                          </div>
                        ))}
                      </div>
                    )}
                    {sourcingForm.nama_kandidat.trim() && sourcingMatches.length === 0 && (
                      <p className="mt-2 text-xs text-ink-500">Kandidat dengan nama tersebut tidak ada di pool.</p>
                    )}
                  </div>
                </div>
              )}

              {isClosed ? (
                <p className="text-xs text-ink-500">Turnover ini sudah selesai, tidak bisa menambah peserta lagi.</p>
              ) : (
                showPicker && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pool.length === 0 ? (
                      <p className="text-xs text-ink-500">Tidak ada peserta Hold yang tersedia di pool saat ini.</p>
                    ) : (
                      pool.map((c) => (
                        <div key={c.id} className="border border-surface-border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{c.nama_kandidat}</p>
                            <p className="text-[11px] text-ink-500">
                              {c.posisi_yang_dilamar || "-"} — {c.hasil_interview || "-"}
                            </p>
                          </div>
                          <PrimaryButton onClick={() => assignCandidate(c.id)} disabled={busyId === c.id} className="text-xs px-2.5 py-1.5">
                            <UserPlus size={13} /> {busyId === c.id ? "Memproses..." : "Ajukan"}
                          </PrimaryButton>
                        </div>
                      ))
                    )}
                  </div>
                )
              )}
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