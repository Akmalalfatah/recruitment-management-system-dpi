import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { turnoverApi, ersApi } from "../../lib/db";
import { Field, TextInput, SelectInput, PrimaryButton, Card } from "../../components/common/Ui";
import { ALASAN_KELUAR_LIST } from "../../lib/constants";
import { useAuth } from "../../contexts/AuthContext";

const emptyForm = {
  ers_document_id: "",
  nama_karyawan_existing: "",
  jabatan: "",
  area_penempatan: "",
  alasan_keluar: "",
  nama_rekruter: "",
  nama_koordinator: "",
  tgl_kirim_kandidat: "",
  tanggal_keluar: "",
  tgl_interview_user: "",
  tgl_pkwt: "",
  tgl_aktif_kerja: "",
  keterangan_proses: "",
};

export default function OpsTurnoverForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [ersOptions, setErsOptions] = useState([]);
  const [loadingErs, setLoadingErs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Turnover can only be created against an ERS that's already
    // Accepted — only Recruitment can accept an ERS (see /recruitment/ers),
    // OPS cannot accept its own submission. An ERS that's already "used
    // up" by another turnover that already reached Accepted can't be
    // picked again either.
    Promise.all([ersApi.list(), turnoverApi.list({})])
      .then(([allErs, allTurnover]) => {
        const usedErsIds = new Set(allTurnover.filter((t) => t.status === "Accepted").map((t) => t.ers_document_id));
        setErsOptions(allErs.filter((e) => e.status === "Accepted" && !usedErsIds.has(e.id)));
      })
      .finally(() => setLoadingErs(false));
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Selecting the supporting ERS document auto-fills the fields it already
  // has data for (area, jabatan, karyawan existing) so the user doesn't
  // have to type them twice.
  function handleErsSelect(ersId) {
    const selected = ersOptions.find((e) => e.id === ersId);
    setForm((f) => ({
      ...f,
      ers_document_id: ersId,
      area_penempatan: selected ? selected.area_penempatan || "" : f.area_penempatan,
      jabatan: selected ? selected.jabatan || "" : f.jabatan,
      nama_karyawan_existing: selected ? selected.nama_karyawan_existing || "" : f.nama_karyawan_existing,
    }));
  }

  const fromErs = !!form.ers_document_id;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await turnoverApi.create({
        ...form,
        created_by: user?.id,
        nama_user: user?.name,
      });
      navigate("/ops/turnover");
    } catch (err) {
      setError(err?.message || "Gagal menyimpan turnover.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate("/ops/turnover")}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary mb-3"
      >
        <ArrowLeft size={15} /> Kembali
      </button>
      <Card className="p-6 max-w-4xl">
        <h1 className="text-lg font-bold text-ink-900 mb-5">Form Permintaan Turnover</h1>

        {!loadingErs && ersOptions.length === 0 && (
          <div className="flex items-start gap-2 bg-status-orange/10 border border-status-orange/30 text-xs text-ink-700 px-3 py-2.5 mb-5">
            <Info size={14} className="text-status-orange shrink-0 mt-0.5" />
            <p>
              Belum ada dokumen ERS yang bisa dipakai. Dokumen ERS harus berstatus{" "}
              <span className="font-semibold">Accepted</span> dan belum dipakai pada turnover lain yang sudah{" "}
              <span className="font-semibold">Accepted</span>. Ajukan ERS baru jika perlu, atau tunggu ERS Anda
              diterima oleh Recruitment.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-ink-900 mb-1">Dokumen ERS Pendukung</p>
            <select
              value={form.ers_document_id}
              onChange={(e) => handleErsSelect(e.target.value)}
              required
              disabled={ersOptions.length === 0}
              className="w-full border border-surface-border px-3 py-2 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-surface-panel"
            >
              <option value="">Pilih dokumen ERS pendukung (Accepted & belum dipakai) dari daftar...</option>
              {ersOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nomor_ers} — {e.jabatan || "-"} — {e.nama_karyawan_existing || "-"} ({e.area_penempatan || "-"})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-ink-300 mt-1">
              {fromErs
                ? "Nama karyawan, jabatan, dan area penempatan di bawah otomatis terisi dari dokumen ini."
                : "Hanya ERS Accepted yang belum dipakai turnover lain yang sudah Accepted yang bisa dipilih."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Karyawan Existing">
              <TextInput value={form.nama_karyawan_existing} disabled required />
            </Field>
            <Field label="Jabatan">
              <TextInput value={form.jabatan} disabled required />
            </Field>

            <Field label="Area Penempatan Kerja">
              <TextInput value={form.area_penempatan} disabled required />
            </Field>
            <Field label="Alasan Keluar">
              <SelectInput value={form.alasan_keluar} onChange={(e) => set("alasan_keluar", e.target.value)} options={ALASAN_KELUAR_LIST} required />
            </Field>

            <Field label="Nama Rekruter">
              <TextInput value={form.nama_rekruter} onChange={(e) => set("nama_rekruter", e.target.value)} placeholder="-" />
            </Field>

            <Field label="Nama Koordinator">
              <TextInput value={form.nama_koordinator} onChange={(e) => set("nama_koordinator", e.target.value)} placeholder="-" />
            </Field>
            <Field label="Tanggal Keluar">
              <TextInput type="date" value={form.tanggal_keluar} onChange={(e) => set("tanggal_keluar", e.target.value)} />
            </Field>

            <Field label="Tanggal Kirim Kandidat">
              <TextInput type="date" value={form.tgl_kirim_kandidat} onChange={(e) => set("tgl_kirim_kandidat", e.target.value)} />
            </Field>
            <Field label="Tanggal Interview User">
              <TextInput type="date" value={form.tgl_interview_user} onChange={(e) => set("tgl_interview_user", e.target.value)} />
            </Field>

            <Field label="Tanggal PKWT">
              <TextInput type="date" value={form.tgl_pkwt} onChange={(e) => set("tgl_pkwt", e.target.value)} />
            </Field>
            <Field label="Tanggal Aktif Kerja">
              <TextInput type="date" value={form.tgl_aktif_kerja} onChange={(e) => set("tgl_aktif_kerja", e.target.value)} />
            </Field>

            <Field label="Nama User (Pemohon)">
              <TextInput value={user?.name || ""} disabled />
            </Field>
          </div>

          <Field label="Keterangan Proses">
            <TextInput value={form.keterangan_proses} onChange={(e) => set("keterangan_proses", e.target.value)} placeholder="-" />
          </Field>

          {error && <p className="text-xs text-status-red">{error}</p>}

          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" disabled={submitting || ersOptions.length === 0}>
              {submitting ? "Menyimpan..." : "Simpan & Selesai"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
