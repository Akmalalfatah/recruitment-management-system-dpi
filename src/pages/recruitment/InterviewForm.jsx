import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { interviewApi, turnoverApi, candidatesApi } from "../../lib/db";
import { Field, TextInput, SelectInput, PrimaryButton, Card } from "../../components/common/Ui";
import { PENDIDIKAN_LIST, AGAMA_LIST, INFO_LOKER_LIST } from "../../lib/constants";

const emptyForm = {
  turnover_id: "",
  nama_kandidat: "",
  posisi_yang_dilamar: "",
  pendidikan: "",
  jurusan: "",
  agama: "",
  info_loker: "",
  tanggal_interview: "",
  tanggal_lahir: "",
  domisili: "",
  no_hp: "",
  keterangan_referensi: "",
  keterangan_interview: "",
};

export default function InterviewForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [turnovers, setTurnovers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only turnovers that are Accepted AND don't already have a hired
    // candidate can receive a new interview — once a turnover's
    // replacement has been found, the search for it is done.
    turnoverApi.list({}).then((all) => setTurnovers(all.filter((t) => t.status === "Accepted" && !t.nama_karyawan_baru)));
    candidatesApi.list().then(setCandidates).catch(() => setCandidates([]));
  }, []);

  const selectedTurnover = turnovers.find((t) => t.id === form.turnover_id) || null;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTurnoverChange(id) {
    const t = turnovers.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      turnover_id: id,
      // Auto-fill fields that follow the selected Turnover request
      posisi_yang_dilamar: t?.jabatan || "",
      domisili: t?.area_penempatan || f.domisili,
    }));
  }

  // Reuse a candidate from the talent pool ("Data Peserta Wawancara") —
  // someone not hired elsewhere but worth reconsidering for a similar job.
  function handleReuseCandidate(candidateId) {
    const c = candidates.find((x) => x.id === candidateId);
    if (!c) return;
    setForm((f) => ({
      ...f,
      nama_kandidat: c.nama_kandidat || f.nama_kandidat,
      pendidikan: c.pendidikan || f.pendidikan,
      jurusan: c.jurusan || f.jurusan,
      agama: c.agama || f.agama,
      info_loker: c.info_loker || f.info_loker,
      tanggal_lahir: c.tanggal_lahir || f.tanggal_lahir,
      domisili: c.domisili || f.domisili,
      no_hp: c.no_hp || f.no_hp,
      keterangan_referensi: c.keterangan_referensi || f.keterangan_referensi,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await interviewApi.create({
        ...form,
        nama_koordinator: selectedTurnover?.nama_koordinator || "-",
        tenggat_waktu_proses: 7,
        list_diajukan_ke_user: "-",
        keterangan_banding: "-",
        hasil_interview: null,
        hire_status: "-",
      });
      navigate("/recruitment/interview");
    } catch (err) {
      setError(err?.message || "Gagal menyimpan interview.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate("/recruitment/interview")}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary mb-3"
      >
        <ArrowLeft size={15} /> Kembali
      </button>
      <Card className="p-6 max-w-4xl">
        <h1 className="text-lg font-bold text-ink-900 mb-1">Form Interview Harian</h1>
        <p className="text-sm text-ink-500 mb-5">
          Data Kandidat. Nilai penilaian, hasil interview, ajukan banding, dan list ke user diisi belakangan lewat
          aksi pensil pada Daftar Interview.
        </p>

        {candidates.length > 0 && (
          <div className="mb-5 bg-primary-50 border border-primary-100 px-4 py-3">
            <Field
              label="Pilih dari Data Peserta Wawancara (opsional)"
              hint="Isi otomatis data pribadi dari peserta yang pernah diwawancara sebelumnya (belum tentu hired) jika sesuai untuk posisi ini."
            >
              <select
                onChange={(e) => handleReuseCandidate(e.target.value)}
                defaultValue=""
                className="w-full border border-surface-border px-3 py-2 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Isi manual / kandidat baru...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama_kandidat} — {c.posisi_terakhir_dilamar || "-"} ({c.hasil_interview || "-"})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Field label="Terkait Permintaan Turnover">
              <select
                value={form.turnover_id}
                onChange={(e) => handleTurnoverChange(e.target.value)}
                required
                className="w-full border border-surface-border px-3 py-2 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Pilih nomor turnover...</option>
                {turnovers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nomor_turnover} - {t.jabatan} ({t.area_penempatan})
                  </option>
                ))}
              </select>
              {turnovers.length === 0 && (
                <p className="flex items-center gap-1.5 text-[11px] text-status-orange mt-1.5">
                  <Info size={12} /> Tidak ada turnover yang masih terbuka (Accepted &amp; belum ada kandidat hired).
                </p>
              )}
            </Field>

            {selectedTurnover && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-primary-50 border border-primary-100 px-4 py-3 text-xs">
                <div>
                  <p className="text-ink-500 uppercase font-medium">Area</p>
                  <p className="text-ink-900 font-semibold">{selectedTurnover.area_penempatan || "-"}</p>
                </div>
                <div>
                  <p className="text-ink-500 uppercase font-medium">Jabatan Dibutuhkan</p>
                  <p className="text-ink-900 font-semibold">{selectedTurnover.jabatan}</p>
                </div>
                <div>
                  <p className="text-ink-500 uppercase font-medium">Karyawan Existing</p>
                  <p className="text-ink-900 font-semibold">{selectedTurnover.nama_karyawan_existing}</p>
                </div>
                <div>
                  <p className="text-ink-500 uppercase font-medium">Alasan Keluar</p>
                  <p className="text-ink-900 font-semibold">{selectedTurnover.alasan_keluar}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Nama">
              <TextInput value={form.nama_kandidat} onChange={(e) => set("nama_kandidat", e.target.value)} required />
            </Field>
            <Field label="Posisi" hint="Mengikuti jabatan pada Turnover yang dipilih">
              <TextInput value={form.posisi_yang_dilamar} onChange={(e) => set("posisi_yang_dilamar", e.target.value)} required disabled={!!selectedTurnover} />
            </Field>
            <Field label="Pendidikan">
              <SelectInput value={form.pendidikan} onChange={(e) => set("pendidikan", e.target.value)} options={PENDIDIKAN_LIST} />
            </Field>
            <Field label="Agama">
              <SelectInput value={form.agama} onChange={(e) => set("agama", e.target.value)} options={AGAMA_LIST} />
            </Field>
            <Field label="Info Lowongan">
              <SelectInput value={form.info_loker} onChange={(e) => set("info_loker", e.target.value)} options={INFO_LOKER_LIST} />
            </Field>
            <Field label="Tanggal Interview">
              <TextInput type="date" value={form.tanggal_interview} onChange={(e) => set("tanggal_interview", e.target.value)} required />
            </Field>
            <Field label="Tanggal Lahir">
              <TextInput type="date" value={form.tanggal_lahir} onChange={(e) => set("tanggal_lahir", e.target.value)} />
            </Field>
            <Field label="Domisili">
              <TextInput value={form.domisili} onChange={(e) => set("domisili", e.target.value)} />
            </Field>
            <Field label="No. HP">
              <TextInput value={form.no_hp} onChange={(e) => set("no_hp", e.target.value)} />
            </Field>
            <Field label="Referensi">
              <TextInput value={form.keterangan_referensi} onChange={(e) => set("keterangan_referensi", e.target.value)} placeholder="-" />
            </Field>
          </div>

          <Field label="Keterangan Tambahan">
            <TextInput value={form.keterangan_interview} onChange={(e) => set("keterangan_interview", e.target.value)} />
          </Field>

          {error && <p className="text-xs text-status-red">{error}</p>}

          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan & Selesai"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
