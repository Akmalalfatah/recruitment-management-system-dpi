import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { ersApi } from "../../lib/db";
import { Field, TextInput, SelectInput, PrimaryButton, Card } from "../../components/common/Ui";
import { JABATAN_LIST, ALASAN_ERS_LIST, OPS_DIVISI, ERS_DISETUJUI_1_DEFAULT, ERS_DITERIMA_DEFAULT } from "../../lib/constants";
import { useAuth } from "../../contexts/AuthContext";

// Hanya field-field "Detil ERS" yang benar-benar diisi OPS di sini. Divisi,
// Nomor ERS, dan Tanggal Pengajuan (Issued Date) TIDAK diinput manual --
// diambil otomatis dari akun OPS yang login & waktu submit (lihat
// mockAdapter.createErs / trigger ers_document_set_nomor di schema.sql).
const emptyForm = {
  alasan_ers: "",
  jenis_kontrak_project: "",
  jabatan: "",
  wilayah_penempatan_kerja: "",
  nama_karyawan_existing: "",
  area_penempatan: "", // = "Lokasi Penempatan Kerja" pada form cetak
  usia: "",
  status_karyawan: "",
  tanggal_aktif_diminta: "",
  kualifikasi: "",
  bahasa: "",
  keahlian: "",
  sertifikat: "",
  // Nama-nama pada blok tanda tangan: terisi otomatis begitu form dibuka,
  // tapi tetap bisa diketik ulang/diganti oleh OPS sebelum disimpan.
  pemohon_nama: "",
  disetujui_1_nama: ERS_DISETUJUI_1_DEFAULT,
  disetujui_2_nama: "",
  diterima_nama: ERS_DITERIMA_DEFAULT,
};

export default function ErsForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({ ...emptyForm, pemohon_nama: user?.name || "" }));
  const [submitting, setSubmitting] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ersApi.create({
        ...form,
        divisi: OPS_DIVISI,
        uploaded_by: user?.id,
      });
      navigate("/ops/ers");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate("/ops/ers")}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary mb-3"
      >
        <ArrowLeft size={15} /> Kembali
      </button>
      <Card className="p-6 max-w-4xl">
        <h1 className="text-lg font-bold text-ink-900 mb-1">Form Pengajuan ERS</h1>
        <p className="text-sm text-ink-500 mb-4">
          Employee Requisition Sheet - isi detil di bawah, lalu sistem akan otomatis membuat nomor ERS
          dan menyusun dokumen PDF resmi sesuai format perusahaan.
        </p>

        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 text-xs text-ink-700 px-3 py-2.5 mb-5">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">Divisi</span> selalu <span className="font-semibold">{OPS_DIVISI}</span>{" "}
            (hanya OPR yang berwenang membuat ERS), <span className="font-semibold">Nomor ERS</span>, dan{" "}
            <span className="font-semibold">Tanggal Pengajuan</span> diisi otomatis oleh sistem dan tidak perlu
            diinput manual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-ink-900 mb-3">Detil ERS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Alasan ERS">
                <SelectInput value={form.alasan_ers} onChange={(e) => set("alasan_ers", e.target.value)} options={ALASAN_ERS_LIST} required />
              </Field>
              <Field label="Jenis Kontrak Project">
                <TextInput
                  value={form.jenis_kontrak_project}
                  onChange={(e) => set("jenis_kontrak_project", e.target.value)}
                  placeholder="cth. BCA INSURANCE"
                  required
                />
              </Field>

              <Field label="Pilih Jabatan">
                <SelectInput value={form.jabatan} onChange={(e) => set("jabatan", e.target.value)} options={JABATAN_LIST} required />
              </Field>
              <Field label="Wilayah Penempatan Kerja">
                <TextInput
                  value={form.wilayah_penempatan_kerja}
                  onChange={(e) => set("wilayah_penempatan_kerja", e.target.value)}
                  placeholder="cth. KANWIL 11"
                  required
                />
              </Field>

              <Field label="Nama Karyawan Yang Diganti / Dikurangi">
                <TextInput
                  value={form.nama_karyawan_existing}
                  onChange={(e) => set("nama_karyawan_existing", e.target.value)}
                  required
                />
              </Field>
              <Field label="Lokasi Penempatan Kerja">
                <TextInput
                  value={form.area_penempatan}
                  onChange={(e) => set("area_penempatan", e.target.value)}
                  placeholder="cth. BCA LIFE - CHASE PLAZA (KP)"
                  required
                />
              </Field>

              <Field label="Usia">
                <TextInput
                  value={form.usia}
                  onChange={(e) => set("usia", e.target.value)}
                  placeholder="cth. MAX. 25 TAHUN"
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={form.status_karyawan}
                  onChange={(e) => set("status_karyawan", e.target.value)}
                  options={["Lajang", "Menikah"]}
                />
              </Field>

              <Field label="Tanggal Aktif Yang Diminta">
                <TextInput type="date" value={form.tanggal_aktif_diminta} onChange={(e) => set("tanggal_aktif_diminta", e.target.value)} required />
              </Field>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-900 mb-3">Persyaratan Jabatan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Kualifikasi">
                <TextInput value={form.kualifikasi} onChange={(e) => set("kualifikasi", e.target.value)} placeholder="cth. SESUAI JOB DESCRIPTIONS" />
              </Field>
              <Field label="Bahasa">
                <TextInput value={form.bahasa} onChange={(e) => set("bahasa", e.target.value)} placeholder="-" />
              </Field>
              <Field label="Keahlian">
                <TextInput value={form.keahlian} onChange={(e) => set("keahlian", e.target.value)} placeholder="-" />
              </Field>
              <Field label="Sertifikat">
                <TextInput value={form.sertifikat} onChange={(e) => set("sertifikat", e.target.value)} placeholder="-" />
              </Field>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-900 mb-3">Tanda Tangan Persetujuan</p>
            <p className="text-xs text-ink-500 mb-3">
              Nama-nama di bawah sudah terisi otomatis, tapi bisa diketik ulang/diganti jika perlu.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Pemohon">
                <TextInput value={form.pemohon_nama} onChange={(e) => set("pemohon_nama", e.target.value)} required />
              </Field>
              <Field label="Disetujui 1 (Division Head)">
                <TextInput value={form.disetujui_1_nama} onChange={(e) => set("disetujui_1_nama", e.target.value)} required />
              </Field>
              <Field label="Disetujui 2 (Director)">
                <TextInput
                  value={form.disetujui_2_nama}
                  onChange={(e) => set("disetujui_2_nama", e.target.value)}
                  placeholder="Nama yang menyetujui ke-2"
                  required
                />
              </Field>
              <Field label="Diterima Oleh (HR Division Head)">
                <TextInput value={form.diterima_nama} onChange={(e) => set("diterima_nama", e.target.value)} required />
              </Field>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan & Generate ERS"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
