import { ROLES, OPS_DIVISI, ERS_DISETUJUI_1_DEFAULT, ERS_DITERIMA_DEFAULT } from "./constants";

const DB_KEY = "dpi_demo_db_v2";
const SESSION_KEY = "dpi_demo_session_v1";
const NOTIF_READS_KEY = "dpi_demo_notif_reads_v1";

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function todayMinus(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seed() {
  const users = [
    { id: "u_super", area_penempatan: "Kantor Pusat", name: "Super Admin", email: "admin@dpi.co.id", role: ROLES.SUPER_ADMIN, status: "Active" },
    { id: "u_ops", area_penempatan: "BCA Wisma Pluit", name: "Michelle Citra Amanda Setiawan", email: "ops@dpi.co.id", role: ROLES.OPS, status: "Active" },
    { id: "u_er", area_penempatan: "Kantor Pusat", name: "Dewi Anggraini", email: "er@dpi.co.id", role: ROLES.HR_ER, status: "Active" },
    { id: "u_rec", area_penempatan: "Kantor Pusat", name: "Ananda Putri", email: "recruitment@dpi.co.id", role: ROLES.HR_RECRUITMENT, status: "Active" },
    { id: "u_train", area_penempatan: "Kantor Pusat", name: "Jeje Ramadhan", email: "training@dpi.co.id", role: ROLES.HR_TRAINING, status: "Active" },
    { id: "u_payroll", area_penempatan: "Kantor Pusat", name: "Sari Wulandari", email: "payroll@dpi.co.id", role: ROLES.HR_PAYROLL, status: "Active" },
  ];

  const ers_document = [
    {
      id: "ers_1", nomor_ers: "00001/OPR BCA.1/ERS/2026", divisi: "OPR BCA.1",
      area_penempatan: "KCP Sudirman", wilayah_penempatan_kerja: "KANWIL 3",
      jabatan: "OFFICE BOY", nama_karyawan_existing: "Budi Santoso",
      alasan_ers: "PENGGANTI HABIS KONTRAK", jenis_kontrak_project: "BCA INSURANCE",
      status_karyawan: "Lajang", usia: "MAX. 30 TAHUN", tanggal_aktif_diminta: todayMinus(-3),
      kualifikasi: "SESUAI JOB DESCRIPTIONS", bahasa: "-", keahlian: "-", sertifikat: "-",
      uploaded_by: "u_ops", pemohon_nama: "Michelle Citra Amanda Setiawan",
      disetujui_1: ERS_DISETUJUI_1_DEFAULT, disetujui_2: "SANTOSO WIBOWO", diterima_oleh: ERS_DITERIMA_DEFAULT,
      status: "Pending", created_at: todayMinus(2), submitted_at: `${todayMinus(2)}T09:14:22.000Z`,
    },
    {
      id: "ers_2", nomor_ers: "00002/OPR BCA.1/ERS/2026", divisi: "OPR BCA.1",
      area_penempatan: "BCA Wisma Pluit", wilayah_penempatan_kerja: "KANWIL 11",
      jabatan: "ADMINISTRASI", nama_karyawan_existing: "Elyani Feronica",
      alasan_ers: "PENGGANTI HABIS KONTRAK", jenis_kontrak_project: "BCA INSURANCE",
      status_karyawan: "Menikah", usia: "MAX. 28 TAHUN", tanggal_aktif_diminta: todayMinus(-1),
      kualifikasi: "SESUAI JOB DESCRIPTIONS", bahasa: "-", keahlian: "-", sertifikat: "-",
      uploaded_by: "u_ops", pemohon_nama: "Michelle Citra Amanda Setiawan",
      disetujui_1: ERS_DISETUJUI_1_DEFAULT, disetujui_2: "SANTOSO WIBOWO", diterima_oleh: ERS_DITERIMA_DEFAULT,
      status: "Accepted", created_at: todayMinus(6), submitted_at: `${todayMinus(6)}T11:02:47.000Z`,
    },
    {
      id: "ers_3", nomor_ers: "00003/OPR BCA.1/ERS/2026", divisi: "OPR BCA.1",
      area_penempatan: "Kantor Pusat", wilayah_penempatan_kerja: "KANWIL 1",
      jabatan: "TEKNISI AC", nama_karyawan_existing: "Ahmad Yani",
      alasan_ers: "PENGGANTI RESIGN", jenis_kontrak_project: "BCA INSURANCE",
      status_karyawan: "Lajang", usia: "MAX. 35 TAHUN", tanggal_aktif_diminta: todayMinus(-5),
      kualifikasi: "SESUAI JOB DESCRIPTIONS", bahasa: "-", keahlian: "TEKNISI HVAC", sertifikat: "-",
      uploaded_by: "u_ops", pemohon_nama: "Michelle Citra Amanda Setiawan",
      disetujui_1: ERS_DISETUJUI_1_DEFAULT, disetujui_2: "SANTOSO WIBOWO", diterima_oleh: ERS_DITERIMA_DEFAULT,
      status: "Rejected", created_at: todayMinus(10), submitted_at: `${todayMinus(10)}T14:38:05.000Z`,
    },
  ];

  const turnover = [
    {
      id: "to_2", area_penempatan: "BCA Wisma Pluit", created_by: "u_ops", ers_document_id: "ers_2",
      nomor_turnover: "TO/2026/001", jabatan: "ADMINISTRASI", nama_karyawan_existing: "Elyani Feronica",
      alasan_keluar: "BERAKHIR KONTRAK", tanggal_permintaan: todayMinus(6), tanggal_keluar: todayMinus(4),
      status: "Sudah Kirim", nama_rekruter: "Ananda Putri", nama_koordinator: "-", nama_karyawan_baru: null,
      tgl_kirim_kandidat: todayMinus(3), tgl_interview_user: todayMinus(2), tgl_pkwt: "-", tgl_aktif_kerja: "-",
      nama_user: "Michelle Citra Amanda Setiawan", keterangan_proses: "Menunggu keputusan kandidat.",
    },
  ];

  const interview_harian = [
    {
      id: "int_1", turnover_id: "to_2", nama_koordinator: "Ananda", tenggat_waktu_proses: 7,
      tanggal_interview: todayMinus(2), nama_kandidat: "Budi Santoso", no_hp: "081234567890",
      posisi_yang_dilamar: "Administrasi", domisili: "Jakarta Utara", pendidikan: "D3", jurusan: "Administrasi Bisnis",
      agama: "Islam", tanggal_lahir: "1998-04-12", info_loker: "LinkedIn", keterangan_referensi: "-",
      keterangan_interview: "Kandidat komunikatif, siap kerja shift.", komunikasi: 4, penampilan: 4,
      pengetahuan_pekerjaan: 3, keterampilan: 4, pengalaman_kerja: 4, hasil_interview: "Recommended",
      keterangan_banding: "-", status: "Recommended", hire_status: "-",
    },
    {
      id: "int_2", turnover_id: null, nama_koordinator: "Jeje", tenggat_waktu_proses: 5,
      tanggal_interview: todayMinus(1), nama_kandidat: "Elyani Feronica", no_hp: "081298765432",
      posisi_yang_dilamar: "Administrasi", domisili: "Jakarta Pusat", pendidikan: "SMA/K", jurusan: "-",
      agama: "Kristen", tanggal_lahir: "2000-01-20", info_loker: "Referensi Internal", keterangan_referensi: "Karyawan lama",
      keterangan_interview: "Masih menunggu keputusan user.", komunikasi: 3, penampilan: 3,
      pengetahuan_pekerjaan: 3, keterampilan: 3, pengalaman_kerja: 2, hasil_interview: "Considered",
      keterangan_banding: "-", status: "Pending", hire_status: "-",
    },
    {
      id: "int_3", turnover_id: null, nama_koordinator: "Ananda", tenggat_waktu_proses: 10,
      tanggal_interview: todayMinus(8), nama_kandidat: "Ahmad Yani", no_hp: "081211122233",
      posisi_yang_dilamar: "Teknisi AC", domisili: "Tangerang", pendidikan: "D3", jurusan: "Teknik Mesin",
      agama: "Islam", tanggal_lahir: "1996-09-05", info_loker: "Jobstreet", keterangan_referensi: "-",
      keterangan_interview: "Pengalaman kurang sesuai kebutuhan, tapi masih layak dipertimbangkan lagi.",
      komunikasi: 2, penampilan: 3, pengetahuan_pekerjaan: 2, keterampilan: 2, pengalaman_kerja: 2,
      hasil_interview: "Not Recommended", keterangan_banding: "-", status: "Not Recommended",
      hire_status: "-",
    },
  ];

  const interview_turnover_log = [
    { id: "log_1", interview_harian_id: "int_1", turnover_id: "to_2", assigned_at: `${todayMinus(2)}T09:05:00.000Z`, unassigned_at: null, outcome: null },
  ];

  const id_card_process = [];

  const notifications = [
    { id: "notif_1", type: "ers", title: "ERS baru diajukan", message: "TEKNISI AC — Kantor Pusat (00003/OPR BCA.1/ERS/2026)", related_id: "ers_3", created_at: `${todayMinus(10)}T14:38:05.000Z` },
    { id: "notif_2", type: "turnover", title: "Turnover baru dibuat otomatis", message: "ADMINISTRASI — Elyani Feronica (TO/2026/001)", related_id: "to_2", created_at: `${todayMinus(6)}T11:10:00.000Z` },
    { id: "notif_3", type: "interview", title: "Interview dijadwalkan", message: `Budi Santoso — Administrasi pada ${todayMinus(2)}`, related_id: "int_1", created_at: `${todayMinus(2)}T09:00:00.000Z` },
  ];

  return { users, ers_document, turnover, interview_harian, interview_turnover_log, id_card_process, notifications };
}

function loadDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
    }
  }
  const fresh = seed();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function pushNotification(db, type, title, message, relatedId) {
  db.notifications = db.notifications || [];
  db.notifications.unshift({
    id: uid("notif"),
    type,
    title,
    message,
    related_id: relatedId,
    created_at: new Date().toISOString(),
  });
}

function autoCreateTurnoverForErs(db, ers) {
  db.turnover = db.turnover || [];
  const already = db.turnover.find((t) => t.ers_document_id === ers.id);
  if (already) return already;
  const rec = {
    id: uid("to"),
    nomor_turnover: `TO/2026/${String(db.turnover.length + 1).padStart(3, "0")}`,
    area_penempatan: ers.area_penempatan,
    created_by: ers.uploaded_by,
    ers_document_id: ers.id,
    jabatan: ers.jabatan,
    nama_karyawan_existing: ers.nama_karyawan_existing,
    alasan_keluar: null,
    nama_rekruter: null,
    nama_koordinator: null,
    tanggal_permintaan: new Date().toISOString().slice(0, 10),
    tanggal_keluar: null,
    tgl_kirim_kandidat: null,
    tgl_interview_user: null,
    tgl_pkwt: null,
    tgl_aktif_kerja: null,
    nama_user: ers.pemohon_nama,
    keterangan_proses: null,
    nama_karyawan_baru: null,
    status: "Belum Kirim",
  };
  db.turnover.unshift(rec);
  pushNotification(
    db,
    "turnover",
    "Turnover baru dibuat otomatis",
    `${rec.jabatan || "-"} — ${rec.nama_karyawan_existing || "-"} (${rec.nomor_turnover})`,
    rec.id
  );
  return rec;
}

function logTurnoverAssignmentChange(db, rec, prevTurnoverId, outcomeAtClose) {
  db.interview_turnover_log = db.interview_turnover_log || [];
  if (prevTurnoverId) {
    const openEntry = db.interview_turnover_log.find(
      (l) => l.interview_harian_id === rec.id && l.turnover_id === prevTurnoverId && !l.unassigned_at
    );
    if (openEntry) {
      openEntry.unassigned_at = new Date().toISOString();
      openEntry.outcome = outcomeAtClose;
    }
  }
  if (rec.turnover_id) {
    db.interview_turnover_log.unshift({
      id: uid("log"),
      interview_harian_id: rec.id,
      turnover_id: rec.turnover_id,
      assigned_at: new Date().toISOString(),
      unassigned_at: null,
      outcome: null,
    });
  }
}

function delay(ms = 120) {
  return new Promise((res) => setTimeout(res, ms));
}

const CREDS_KEY = "dpi_demo_creds_v1";
const BASE_DEMO_CREDENTIALS = {
  "admin@dpi.co.id": "admin123",
  "ops@dpi.co.id": "ops123",
  "er@dpi.co.id": "er123",
  "recruitment@dpi.co.id": "rec123",
  "training@dpi.co.id": "train123",
  "payroll@dpi.co.id": "pay123",
};
function loadCreds() {
  const raw = localStorage.getItem(CREDS_KEY);
  return { ...BASE_DEMO_CREDENTIALS, ...(raw ? JSON.parse(raw) : {}) };
}
function saveCred(email, password) {
  const extra = localStorage.getItem(CREDS_KEY);
  const parsed = extra ? JSON.parse(extra) : {};
  parsed[email.toLowerCase()] = password;
  localStorage.setItem(CREDS_KEY, JSON.stringify(parsed));
}
const DEMO_CREDENTIALS = BASE_DEMO_CREDENTIALS;

export const mockAdapter = {
  DEMO_CREDENTIALS,

  async signIn(email, password) {
    await delay();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const creds = loadCreds();
    if (!user || creds[user.email.toLowerCase()] !== password) {
      throw new Error("Email atau password salah.");
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  async signOut() {
    await delay(60);
    localStorage.removeItem(SESSION_KEY);
  },

  async getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async listUsers() {
    await delay();
    const db = loadDb();
    return [...db.users].sort((a, b) => a.name.localeCompare(b.name));
  },

  async createUser({ name, email, password, role, area_penempatan }) {
    await delay();
    const db = loadDb();
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email ini sudah dipakai user lain.");
    }
    const rec = { id: uid("user"), name, email, role, area_penempatan: area_penempatan || null, status: "Active" };
    db.users.push(rec);
    saveDb(db);
    saveCred(email, password);
    return rec;
  },

  async updateUser(id, patch) {
    await delay();
    const db = loadDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User tidak ditemukan.");
    db.users[idx] = { ...db.users[idx], ...patch };
    saveDb(db);
    return db.users[idx];
  },

  async removeUser(id) {
    await delay();
    const db = loadDb();
    db.users = db.users.filter((u) => u.id !== id);
    saveDb(db);
  },

  async listErs({ dateFrom, dateTo } = {}) {
    await delay();
    const db = loadDb();
    return db.ers_document
      .filter((e) => inRange(e.created_at, dateFrom, dateTo))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  async createErs(payload) {
    await delay();
    const db = loadDb();
    const now = new Date();
    const divisi = OPS_DIVISI;
    const seqInDivisi = db.ers_document.filter((e) => e.divisi === divisi).length + 1;
    const nomor_ers = `${String(seqInDivisi).padStart(5, "0")}/${divisi}/ERS/${now.getFullYear()}`;
    const rec = {
      id: uid("ers"),
      nomor_ers,
      divisi,
      disetujui_1: ERS_DISETUJUI_1_DEFAULT,
      diterima_oleh: ERS_DITERIMA_DEFAULT,
      status: "Pending",
      created_at: now.toISOString().slice(0, 10), 
      submitted_at: now.toISOString(), 
      ...payload,
    };
    db.ers_document.unshift(rec);
    pushNotification(db, "ers", "ERS baru diajukan", `${rec.jabatan || "-"} — ${rec.area_penempatan || "-"} (${rec.nomor_ers})`, rec.id);
    saveDb(db);
    return rec;
  },

  async updateErsStatus(id, status) {
    await delay();
    const db = loadDb();
    const rec = db.ers_document.find((e) => e.id === id);
    if (rec) {
      if (rec.status !== "Pending" && status !== rec.status) {
        throw new Error(`Status ERS ini sudah ${rec.status} dan tidak bisa diubah lagi.`);
      }
      const wasAccepted = rec.status === "Accepted";
      rec.status = status;
      if (status === "Accepted" && !wasAccepted) {
        autoCreateTurnoverForErs(db, rec);
      }
    }
    saveDb(db);
    return rec;
  },

  async listTurnover({ dateFrom, dateTo } = {}) {
    await delay();
    const db = loadDb();
    return db.turnover
      .filter((t) => inRange(t.tanggal_permintaan, dateFrom, dateTo))
      .sort((a, b) => (a.tanggal_permintaan < b.tanggal_permintaan ? 1 : -1));
  },

  async getTurnover(id) {
    await delay();
    const db = loadDb();
    return db.turnover.find((x) => x.id === id) || null;
  },

  async updateTurnover(id, patch) {
    await delay();
    const db = loadDb();
    const rec = db.turnover.find((t) => t.id === id);
    if (rec) {
      const prevStatus = rec.status;
      Object.assign(rec, patch);
      if ("status" in patch && patch.status !== prevStatus && patch.status === "Terpilih") {
        pushNotification(
          db,
          "turnover",
          "Turnover selesai",
          `${rec.jabatan || "-"} — ${rec.nama_karyawan_baru || rec.nama_karyawan_existing || "-"} (${rec.nomor_turnover})`,
          rec.id
        );
      }
    }
    saveDb(db);
    return rec;
  },

  async listInterviews({ dateFrom, dateTo } = {}) {
    await delay();
    const db = loadDb();
    return db.interview_harian
      .filter((i) => inRange(i.tanggal_interview, dateFrom, dateTo))
      .map((i) => ({ ...i, turnover: db.turnover.find((t) => t.id === i.turnover_id) || null }))
      .sort((a, b) => (a.tanggal_interview < b.tanggal_interview ? 1 : -1));
  },

  async listHoldInterviews({ dateFrom, dateTo } = {}) {
    await delay();
    const db = loadDb();
    return db.interview_harian
      .filter((i) => (i.hasil_interview === "Recommended" || i.hasil_interview === "Considered") && inRange(i.tanggal_interview, dateFrom, dateTo))
      .map((i) => ({ ...i, turnover: db.turnover.find((t) => t.id === i.turnover_id) || null }))
      .sort((a, b) => (a.tanggal_interview < b.tanggal_interview ? 1 : -1));
  },

  async listAvailablePool() {
    await delay();
    const db = loadDb();
    return db.interview_harian
      .filter((i) => (i.hasil_interview === "Recommended" || i.hasil_interview === "Considered") && !i.turnover_id)
      .sort((a, b) => (a.tanggal_interview < b.tanggal_interview ? 1 : -1));
  },

  async listInterviewHistory(interviewId) {
    await delay();
    const db = loadDb();
    return (db.interview_turnover_log || [])
      .filter((l) => l.interview_harian_id === interviewId)
      .map((l) => ({ ...l, turnover: db.turnover.find((t) => t.id === l.turnover_id) || null }))
      .sort((a, b) => (a.assigned_at < b.assigned_at ? 1 : -1));
  },

  async listTurnoverCandidateHistory(turnoverId) {
    await delay();
    const db = loadDb();
    return (db.interview_turnover_log || [])
      .filter((l) => l.turnover_id === turnoverId && l.unassigned_at)
      .map((l) => ({ ...l, interview_harian: db.interview_harian.find((i) => i.id === l.interview_harian_id) || null }))
      .sort((a, b) => (a.assigned_at < b.assigned_at ? 1 : -1));
  },

  async createInterview(payload) {
    await delay();
    const db = loadDb();
    const rec = {
      id: uid("int"),
      status: payload.hasil_interview || "Pending",
      hire_status: "-",
      turnover_id: null,
      ...payload,
    };
    db.interview_harian.unshift(rec);
    pushNotification(
      db,
      "interview",
      "Interview dijadwalkan",
      `${rec.nama_kandidat || "-"} — ${rec.posisi_yang_dilamar || "-"}${rec.tanggal_interview ? ` pada ${rec.tanggal_interview}` : ""}`,
      rec.id
    );
    saveDb(db);
    return rec;
  },

  async updateInterview(id, patch) {
    await delay();
    const db = loadDb();
    const rec = db.interview_harian.find((i) => i.id === id);
    if (!rec) {
      saveDb(db);
      return null;
    }
    const prevHireStatus = rec.hire_status;
    const prevTurnoverId = rec.turnover_id;

    if ("turnover_id" in patch && patch.turnover_id !== prevTurnoverId) {
      if (prevHireStatus === "Hired") {
        throw new Error("Kandidat ini sudah Hired, tidak bisa dipindah/diajukan ke turnover lain.");
      }
      if (patch.turnover_id) {
        const target = db.turnover.find((t) => t.id === patch.turnover_id);
        if (target?.status === "Terpilih") {
          throw new Error(`Turnover ini sudah Terpilih (selesai), tidak bisa menambah peserta baru.`);
        }
      }
    }

    Object.assign(rec, patch);
    if ("turnover_id" in patch && patch.turnover_id !== prevTurnoverId) {
      logTurnoverAssignmentChange(db, rec, prevTurnoverId, prevHireStatus);
    }

    if (rec.turnover_id && "hire_status" in patch) {
      const t = db.turnover.find((x) => x.id === rec.turnover_id);
      if (t) {
        if (rec.hire_status === "Hired") {
          t.nama_karyawan_baru = rec.nama_kandidat;
          t.status = "Terpilih";
        } else if (prevHireStatus === "Hired" && t.nama_karyawan_baru === rec.nama_kandidat) {
          t.nama_karyawan_baru = null;
          t.status = "Interview User";
        }
      }
    }

    if ("hire_status" in patch && rec.hire_status === "Hired" && prevHireStatus !== "Hired") {
      pushNotification(
        db,
        "interview",
        "Kandidat hired",
        `${rec.nama_kandidat || "-"} dinyatakan hired untuk posisi ${rec.posisi_yang_dilamar || "-"}. ID Card sedang diproses Training.`,
        rec.id
      );
      db.interview_harian
        .filter((i) => i.turnover_id === rec.turnover_id && i.id !== rec.id && i.hire_status !== "Hired")
        .forEach((sibling) => {
          const siblingPrevTurnoverId = sibling.turnover_id;
          sibling.hire_status = "Not Hired";
          sibling.turnover_id = null;
          logTurnoverAssignmentChange(db, sibling, siblingPrevTurnoverId, "Not Hired");
        });
    }

    saveDb(db);
    return rec;
  },

  async deleteInterview(id) {
    await delay();
    const db = loadDb();
    db.interview_harian = db.interview_harian.filter((i) => i.id !== id);
    saveDb(db);
  },

  async listIdCards({ dateFrom, dateTo } = {}) {
    await delay();
    const db = loadDb();
    return db.id_card_process
      .filter((c) => inRange(c.tanggal_mulai, dateFrom, dateTo))
      .sort((a, b) => (a.tanggal_mulai < b.tanggal_mulai ? 1 : -1));
  },

  async updateIdCardStatus(id, status) {
    await delay();
    const db = loadDb();
    const rec = db.id_card_process.find((c) => c.id === id);
    if (rec) {
      const changed = rec.status !== status;
      rec.status = status;
      if (changed && status === "Completed") {
        pushNotification(db, "idcard", "ID Card selesai diproses", `${rec.nama_karyawan || "-"} — ${rec.jabatan || "-"} (${rec.nomor_karyawan || "-"})`, rec.id);
      }
    }
    saveDb(db);
    return rec;
  },

  async updateIdCard(id, patch) {
    await delay();
    const db = loadDb();
    const rec = db.id_card_process.find((c) => c.id === id);
    if (rec) {
      const wasCompleted = rec.status === "Completed";
      Object.assign(rec, patch);
      if (!wasCompleted && rec.status === "Completed") {
        pushNotification(db, "idcard", "ID Card selesai diproses", `${rec.nama_karyawan || "-"} — ${rec.jabatan || "-"} (${rec.nomor_karyawan || "-"})`, rec.id);
      }
    }
    saveDb(db);
    return rec;
  },

  async createIdCardFromInterview(interviewId) {
    await delay();
    const db = loadDb();
    const interview = db.interview_harian.find((i) => i.id === interviewId);
    if (!interview) return null;
    const exists = db.id_card_process.find((c) => c.recruitment_id === interviewId);
    if (exists) return exists;
    const now = new Date();
    const seq = db.id_card_process.length + 1;
    const nomor_karyawan = `${now.getFullYear()}${String(seq).padStart(4, "0")}`;
    const rec = {
      id: uid("idc"),
      recruitment_id: interviewId,
      nama_karyawan: interview.nama_kandidat,
      jabatan: interview.posisi_yang_dilamar,
      nomor_karyawan,
      tanggal_mulai: now.toISOString().slice(0, 10),
      file_name: "-",
      photo_data_url: "",
      status: "Pending",
      catatan: "-",
    };
    db.id_card_process.unshift(rec);
    saveDb(db);
    return rec;
  },

  async resetDemoData() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(NOTIF_READS_KEY);
    loadDb();
  },

  async listNotifications(limit = 20) {
    await delay(80);
    const db = loadDb();
    const readIds = new Set(JSON.parse(localStorage.getItem(NOTIF_READS_KEY) || "[]"));
    return [...(db.notifications || [])]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit)
      .map((n) => ({ ...n, is_read: readIds.has(n.id) }));
  },

  async markNotificationRead(id) {
    await delay(60);
    const readIds = new Set(JSON.parse(localStorage.getItem(NOTIF_READS_KEY) || "[]"));
    readIds.add(id);
    localStorage.setItem(NOTIF_READS_KEY, JSON.stringify([...readIds]));
  },

  async markAllNotificationsRead() {
    await delay(60);
    const db = loadDb();
    const readIds = new Set((db.notifications || []).map((n) => n.id));
    localStorage.setItem(NOTIF_READS_KEY, JSON.stringify([...readIds]));
  },
};

function inRange(dateStr, from, to) {
  if (!dateStr || dateStr === "-") return true;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}