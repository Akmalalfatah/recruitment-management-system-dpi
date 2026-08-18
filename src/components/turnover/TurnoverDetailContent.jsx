import StatusBadge from "../common/StatusBadge";
import { formatDate } from "../../utils/formatDate";

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-ink-900">{value || "-"}</span>
    </div>
  );
}

export default function TurnoverDetailContent({ record }) {
  if (!record) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-ink-900">{record.nomor_turnover}</p>
          <p className="text-xs text-ink-500">{record.area_penempatan || "-"}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Row label="Jabatan" value={record.jabatan} />
        <Row label="Karyawan Existing" value={record.nama_karyawan_existing} />
        <Row label="Karyawan Baru" value={record.nama_karyawan_baru} />
        <Row label="Alasan Keluar" value={record.alasan_keluar} />
        <Row label="Area Penempatan" value={record.area_penempatan} />
        <Row label="Tanggal Pengajuan" value={formatDate(record.tanggal_permintaan)} />
        <Row label="Tanggal Keluar" value={formatDate(record.tanggal_keluar)} />
        <Row label="Nama Rekruter" value={record.nama_rekruter} />
        <Row label="Nama Koordinator" value={record.nama_koordinator} />
        <Row label="Tgl Kirim Kandidat" value={formatDate(record.tgl_kirim_kandidat)} />
        <Row label="Tgl Interview User" value={formatDate(record.tgl_interview_user)} />
        <Row label="Tgl PKWT" value={formatDate(record.tgl_pkwt)} />
        <Row label="Tgl Aktif Kerja" value={formatDate(record.tgl_aktif_kerja)} />
        <Row label="Nama User" value={record.nama_user} />
      </div>
      <div className="mt-4">
        <Row label="Keterangan Proses" value={record.keterangan_proses} />
      </div>
    </div>
  );
}
