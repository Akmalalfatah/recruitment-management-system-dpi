import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ersApi, turnoverApi, interviewApi, idCardApi } from "../../lib/db";
import { ROLES, ROLE_LABELS } from "../../lib/constants";
import { Card, StatCard } from "../../components/common/Ui";
import StatusBadge from "../../components/common/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ ers: [], turnover: [], interviews: [], idcards: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ersApi.list(), turnoverApi.list(), interviewApi.list(), idCardApi.list()])
      .then(([ers, turnover, interviews, idcards]) => setData({ ers, turnover, interviews, idcards }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink-500 text-sm">Memuat dashboard...</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-900">Halo, {user?.name?.split(" ")[0] || "Pengguna"}!</h1>
        <p className="text-sm text-ink-500">Ringkasan untuk modul {ROLE_LABELS[user?.role]}.</p>
      </div>

      {roleDashboard(user?.role, data)}
    </div>
  );
}

function roleDashboard(role, data) {
  switch (role) {
    case ROLES.OPS:
      return <OpsDashboard data={data} />;
    case ROLES.HR_ER:
      return <ErDashboard data={data} />;
    case ROLES.HR_RECRUITMENT:
      return <RecruitmentDashboard data={data} />;
    case ROLES.HR_TRAINING:
      return <TrainingDashboard data={data} />;
    case ROLES.HR_PAYROLL:
      return <PayrollDashboard data={data} />;
    case ROLES.SUPER_ADMIN:
      return <SuperAdminDashboard data={data} />;
    default:
      return null;
  }
}

const pending = (arr) => arr.filter((x) => x.status === "Pending").length;

function OpsDashboard({ data }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="ERS Pending" value={pending(data.ers)} />
        <StatCard label="Turnover Pending" value={pending(data.turnover)} accent="secondary" />
        <StatCard label="Turnover Accepted" value={data.turnover.filter((t) => t.status === "Accepted").length} accent="green" />
        <StatCard label="Total Turnover" value={data.turnover.length} accent="blue" />
      </div>
      <PendingTable title="Status Pengajuan ERS" rows={data.ers} link="/ops/ers" nameKey="nomor_ers" subKey="area_penempatan" />
    </>
  );
}

function ErDashboard({ data }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Turnover Pending" value={pending(data.turnover)} />
        <StatCard label="Turnover Accepted" value={data.turnover.filter((t) => t.status === "Accepted").length} accent="green" />
        <StatCard label="Total Turnover & PKWT" value={data.turnover.length} accent="blue" />
      </div>
      <PendingTable title="Data Turnover Terbaru" rows={data.turnover} link="/er/turnover" nameKey="nomor_turnover" subKey="jabatan" />
    </>
  );
}

function RecruitmentDashboard({ data }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayInterviews = data.interviews.filter((i) => i.tanggal_interview === today);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="ERS Menunggu Review" value={pending(data.ers)} accent="secondary" />
        <StatCard label="Turnover Masih Proses" value={data.turnover.filter((t) => t.status === "Pending").length} />
        <StatCard label="Interview Harian" value={data.interviews.length} accent="secondary" />
        <StatCard label="Kandidat Direkomendasikan" value={data.interviews.filter((i) => i.hasil_interview === "Recommended").length} accent="green" />
        <StatCard label="Interview Hari Ini" value={todayInterviews.length} accent="blue" />
      </div>
      <PendingTable title="Jadwal Interview Terbaru" rows={data.interviews} link="/recruitment/interview" nameKey="nama_kandidat" subKey="posisi_yang_dilamar" />
    </>
  );
}

function TrainingDashboard({ data }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Kandidat Hired" value={data.turnover.filter((t) => t.status === "Accepted").length} accent="green" />
        <StatCard label="ID Card Pending" value={pending(data.idcards)} accent="secondary" />
        <StatCard label="ID Card Selesai" value={data.idcards.filter((c) => c.status === "Completed").length} accent="blue" />
      </div>
      <PendingTable title="Antrean Pembuatan ID Card" rows={data.idcards} link="/training/idcard" nameKey="nama_karyawan" subKey="jabatan" />
    </>
  );
}

function PayrollDashboard({ data }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Turnover Pending" value={pending(data.turnover)} />
        <StatCard label="Turnover Accepted" value={data.turnover.filter((t) => t.status === "Accepted").length} accent="green" />
        <StatCard label="Total Data Turnover" value={data.turnover.length} accent="blue" />
      </div>
      <PendingTable title="Data Turnover Terbaru" rows={data.turnover} link="/payroll/turnover" nameKey="nomor_turnover" subKey="jabatan" />
    </>
  );
}

function SuperAdminDashboard({ data }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total ERS" value={data.ers.length} />
      <StatCard label="Total Turnover" value={data.turnover.length} accent="secondary" />
      <StatCard label="Total Interview" value={data.interviews.length} accent="blue" />
      <StatCard label="ID Card Pending" value={pending(data.idcards)} accent="green" />
    </div>
  );
}

function PendingTable({ title, rows, link, nameKey, subKey }) {
  const top = rows.slice(0, 5);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-ink-900 text-sm">{title}</h3>
        <Link to={link} className="text-xs font-semibold text-primary hover:underline">
          Lihat Semua
        </Link>
      </div>
      <div className="divide-y divide-surface-border">
        {top.length === 0 && <p className="text-sm text-ink-500 py-4">Belum ada data.</p>}
        {top.map((row) => (
          <div key={row.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="font-medium text-ink-900">{row[nameKey]}</p>
              <p className="text-xs text-ink-500">
                {typeof row[subKey] === "object" ? row[subKey]?.nama_area : row[subKey]}
              </p>
            </div>
            <StatusBadge status={row.status || row.hasil_interview} />
          </div>
        ))}
      </div>
    </Card>
  );
}
