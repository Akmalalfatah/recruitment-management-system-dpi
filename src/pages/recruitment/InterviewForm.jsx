import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { interviewApi } from "../../lib/db";
import { Field, TextInput, SelectInput, PrimaryButton, Card } from "../../components/common/Ui";
import { PENDIDIKAN_LIST, AGAMA_LIST, INFO_LOKER_LIST, JABATAN_LIST } from "../../lib/constants";

const emptyForm = {
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
  const [holdCandidates, setHoldCandidates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Interview is now fully independent of turnover -- it can be done any
    // time. We only offer a way to reuse a previously-held candidate's
    // personal data if they're interviewing again for a different role.
    interviewApi.listHold().then(setHoldCandidates).catch(() => setHoldCandidates([]));
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Reuse a candidate from the talent pool ("Data Peserta Wawancara") —
  // someone already interviewed before and kept on Hold.
  function handleReuseCandidate(candidateId) {
    const c = holdCandidates.find((x) => x.id === candidateId);
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
        turnover_id: null, // diajukan ke turnover belakangan, dari layar Turnover
        nama_koordinator: "-",
        tenggat_waktu_proses: 7,
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
          Interview bisa dilakukan kapan saja, tidak perlu terkait turnover tertentu -- kandidat baru diajukan ke
          turnover yang sesuai belakangan lewat layar Turnover. Nilai penilaian dan hasil interview diisi belakangan
          lewat aksi pensil pada Daftar Interview -- kandidat dengan hasil Recommended/Considered otomatis muncul di
          Data Peserta Wawancara.
        </p>

        {holdCandidates.length > 0 && (
          <div className="mb-5 bg-primary-50 border border-primary-100 px-4 py-3">
            <Field
              label="Pilih dari Data Peserta Wawancara (opsional)"
              hint="Isi otomatis data pribadi dari peserta yang pernah diwawancara sebelumnya jika orang yang sama interview ulang untuk posisi lain."
            >
              <select
                onChange={(e) => handleReuseCandidate(e.target.value)}
                defaultValue=""
                className="w-full border border-surface-border px-3 py-2 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Isi manual / kandidat baru...</option>
                {holdCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama_kandidat} — {c.posisi_yang_dilamar || "-"} ({c.hasil_interview || "-"})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Nama">
              <TextInput value={form.nama_kandidat} onChange={(e) => set("nama_kandidat", e.target.value)} required />
            </Field>
            <Field label="Posisi Dilamar">
              <SelectInput value={form.posisi_yang_dilamar} onChange={(e) => set("posisi_yang_dilamar", e.target.value)} options={JABATAN_LIST} />
            </Field>
            <Field label="Pendidikan">
              <SelectInput value={form.pendidikan} onChange={(e) => set("pendidikan", e.target.value)} options={PENDIDIKAN_LIST} />
            </Field>
            <Field label="Jurusan">
              <TextInput value={form.jurusan} onChange={(e) => set("jurusan", e.target.value)} placeholder="-" />
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
