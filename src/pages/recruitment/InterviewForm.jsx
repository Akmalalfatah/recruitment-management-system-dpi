import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { interviewApi } from "../../lib/db";
import { Field, TextInput, SelectInput, PrimaryButton, Card } from "../../components/common/Ui";
import { PENDIDIKAN_LIST, AGAMA_LIST, INFO_LOKER_LIST, JABATAN_LIST, REKRUTER_LIST } from "../../lib/constants";

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
  nama_koordinator: "",
};

export default function InterviewForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await interviewApi.create({
        ...form,
        turnover_id: null, 
        nama_koordinator: form.nama_koordinator || "-",
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
          Interview dapat dilakukan tanpa turnover tertentu. Kandidat diajukan ke turnover melalui layar Turnover. Penilaian dan hasil interview diisi kemudian. Kandidat Recommended/Considered otomatis masuk Data Peserta Wawancara.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Nama">
              <TextInput value={form.nama_kandidat} onChange={(e) => set("nama_kandidat", e.target.value)} required />
            </Field>
            <Field label="Posisi Dilamar">
              <SelectInput value={form.posisi_yang_dilamar} onChange={(e) => set("posisi_yang_dilamar", e.target.value)} options={JABATAN_LIST} />
            </Field>
            <Field label="Nama Koordinator / Rekruter">
              <SelectInput
                value={form.nama_koordinator}
                onChange={(e) => set("nama_koordinator", e.target.value)}
                options={REKRUTER_LIST}
                placeholder="Pilih rekruter..."
              />
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