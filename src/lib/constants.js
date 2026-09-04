export const ROLES = {
  SUPER_ADMIN: "Super_Admin",
  OPS: "OPS",
  HR_ER: "HR_ER",
  HR_RECRUITMENT: "HR_Recruitment",
  HR_TRAINING: "HR_Training",
  HR_PAYROLL: "HR_Payroll",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.OPS]: "Operasional",
  [ROLES.HR_ER]: "Employee Relation",
  [ROLES.HR_RECRUITMENT]: "Recruitment",
  [ROLES.HR_TRAINING]: "Training",
  [ROLES.HR_PAYROLL]: "Payroll",
};

export const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]: "/dashboard",
  [ROLES.OPS]: "/dashboard",
  [ROLES.HR_ER]: "/dashboard",
  [ROLES.HR_RECRUITMENT]: "/dashboard",
  [ROLES.HR_TRAINING]: "/dashboard",
  [ROLES.HR_PAYROLL]: "/dashboard",
};

export const TURNOVER_STATUS_LIST = [
  "Belum Kirim", "Sudah Kirim", "Pengurangan", "Interview User",
  "Terpilih", "Menunggu Info User", "Dihold Sementara",
];
export const TURNOVER_STATUS_TERPILIH = "Terpilih";
export const TURNOVER_STATUS_DEFAULT = "Belum Kirim";

export const ERS_STATUS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const STATUS_BADGE_STYLE = {
  Pending: "bg-status-orange",
  Accepted: "bg-status-green",
  Rejected: "bg-status-red",
  Recommended: "bg-status-green",
  Considered: "bg-status-orange",
  "Not Recommended": "bg-status-red",
  "In Progress": "bg-status-blue",
  Completed: "bg-status-green",
  Hired: "bg-status-green",
  "Not Hired": "bg-status-teal",
  "Belum Hired": "bg-ink-300",
  "-": "bg-ink-300",
  "Belum Kirim": "bg-ink-300",
  "Sudah Kirim": "bg-status-blue",
  Pengurangan: "bg-status-orange",
  "Interview User": "bg-status-blue",
  Terpilih: "bg-status-green",
  "Menunggu Info User": "bg-status-orange",
  "Dihold Sementara": "bg-status-red",
  "Masih Diajukan": "bg-status-blue",
  Dilepas: "bg-ink-300",
  Active: "bg-status-green",
  Inactive: "bg-ink-300",
};

export const JABATAN_LIST = [
  "ADMINISTRASI", "ADMIN AO/RO", "ADMIN SEKRETARIS", "SEKRETARIS", "RESEPSIONIS",
  "OFFICE BOY", "EKSPEDISI", "PENDUKUNG PENUTUPAN", "PENDUKUNG KLAIM", "CALL CENTER",
  "BLUFRIEND", "RELIFER KP", "RELIFER MAD", "DRIVER", "ADMIN CCTV",
  "ADMIN LEGAL", "ADMIN COPYWRITER", "ADMIN DESIGN GRAPHIC", "ADMIN APK",
  "LIFTMAN", "ADMIN INTERNAL CONTROL", "ADMIN DX", "ADMIN OPERATION", "HELPDESK",
  "TL BLUFRIENDS", "ADMIN KANWIL", "TEKNISI EDC", "TEKNISI MEP", "TEKNISI AC",
  "BUILDING MANAGER", "QC ME", "SPV HK", "CLEANING SERVICE", "LEADER CLEANING SERVICE",
];

export const ALASAN_KELUAR_LIST = [
  "PENAMBAHAN", "RESIGN", "CUMEL", "BERAKHIR KONTRAK", "TERMINASI", "MUTASI", "DEMOSI",
];

export const ALASAN_ERS_LIST = [
  "PENGGANTI HABIS KONTRAK", "PENAMBAHAN HEADCOUNT", "PENGGANTI RESIGN", "PENGGANTI TERMINASI",
];

export const OPS_DIVISI = "OPR BCA.1";

export const PENDIDIKAN_LIST = ["SMA/K", "D3", "D4", "S1", "S2"];

export const AGAMA_LIST = ["Islam", "Kristen", "Katolik", "Hindu", "Budha", "Konghucu"];

export const INFO_LOKER_LIST = [
  "Jobstreet", "LinkedIn", "Pintarnya", "Glints", "Email", "Sosmed", "Referensi Internal", "Referensi Eksternal",
];

export const HASIL_INTERVIEW_LIST = ["Recommended", "Considered", "Not Recommended"];

export const REKRUTER_LIST = [
  "Febri", "Eka", "Anton", "Reggy", "Widad", "Dinda", "Ryan", "Rani", "Rodrik", "Bayu", "Redi", "Puja",
];

export const HIRE_STATUS = {
  NONE: "-",
  HIRED: "Hired",
  NOT_HIRED: "Not Hired",
};

export const KRITERIA_PENILAIAN = [
  { key: "komunikasi", label: "Komunikasi", bobot: 20 },
  { key: "penampilan", label: "Penampilan", bobot: 20 },
  { key: "pengetahuan_pekerjaan", label: "Pengetahuan Pekerjaan", bobot: 20 },
  { key: "keterampilan", label: "Keterampilan / Keahlian", bobot: 20 },
  { key: "pengalaman_kerja", label: "Pengalaman Kerja", bobot: 20 },
];

export const ID_CARD_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const ERS_DISETUJUI_1_DEFAULT = "R. STEVE TIYANTOKO";
export const ERS_DITERIMA_DEFAULT = "AGARISMAN KRISTOAJI";