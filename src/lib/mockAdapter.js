import { ROLES, OPS_DIVISI, ERS_DISETUJUI_1_DEFAULT, ERS_DITERIMA_DEFAULT } from "./constants";

// -----------------------------------------------------------------------
// Local, in-browser demo database. Persists to localStorage so the app is
// fully click-through-able without a real Supabase project. The shape of
// every record mirrors the Supabase schema in /supabase/schema.sql, so
// swapping this adapter for real Supabase calls in db.js is a drop-in.
// -----------------------------------------------------------------------

const DB_KEY = "dpi_demo_db_v1";
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
      id: "to_1", area_penempatan: "KCP Sudirman", created_by: "u_ops", ers_document_id: "ers_1",
      nomor_turnover: "TO/2026/001", jabatan: "OFFICE BOY", nama_karyawan_existing: "Budi Santoso",
      alasan_keluar: "BERAKHIR KONTRAK", tanggal_permintaan: todayMinus(2), tanggal_keluar: todayMinus(1),
      status: "Pending", nama_rekruter: "-", nama_koordinator: "-",
      tgl_kirim_kandidat: "-", tgl_interview_user: "-", tgl_pkwt: "-", tgl_aktif_kerja: "-",
      nama_user: "Michelle Citra Amanda Setiawan", keterangan_proses: "-",
    },
    {
      id: "to_2", area_penempatan: "BCA Wisma Pluit", created_by: "u_ops", ers_document_id: "ers_2",
      nomor_turnover: "TO/2026/002", jabatan: "ADMINISTRASI", nama_karyawan_existing: "Elyani Feronica",
      alasan_keluar: "BERAKHIR KONTRAK", tanggal_permintaan: todayMinus(6), tanggal_keluar: todayMinus(4),
      status: "Accepted", nama_rekruter: "Ananda Putri", nama_koordinator: "-",
      tgl_kirim_kandidat: todayMinus(3), tgl_interview_user: todayMinus(2), tgl_pkwt: "-", tgl_aktif_kerja: "-",
      nama_user: "Michelle Citra Amanda Setiawan", keterangan_proses: "Kandidat pengganti: Budi Santoso",
    },
    {
      id: "to_3", area_penempatan: "Kantor Pusat", created_by: "u_ops", ers_document_id: "ers_3",
      nomor_turnover: "TO/2026/003", jabatan: "TEKNISI AC", nama_karyawan_existing: "Ahmad Yani",
      alasan_keluar: "RESIGN", tanggal_permintaan: todayMinus(10), tanggal_keluar: todayMinus(8),
      status: "Rejected", nama_rekruter: "-", nama_koordinator: "-",
      tgl_kirim_kandidat: "-", tgl_interview_user: "-", tgl_pkwt: "-", tgl_aktif_kerja: "-",
      nama_user: "Michelle Citra Amanda Setiawan", keterangan_proses: "Ditolak: headcount dibekukan",
    },
  ];

  const interview_harian = [
    {
      id: "int_1", turnover_id: "to_2", nama_koordinator: "Ananda", tenggat_waktu_proses: 7,
      tanggal_pkwt: "-", tanggal_interview: todayMinus(2), nama_kandidat: "Budi Santoso", no_hp: "081234567890",
      posisi_yang_dilamar: "Administrasi", domisili: "Jakarta Utara", pendidikan: "D3", jurusan: "Administrasi Bisnis",
      agama: "Islam", tanggal_lahir: "1998-04-12", info_loker: "LinkedIn", keterangan_referensi: "-",
      keterangan_interview: "Kandidat komunikatif, siap kerja shift.", komunikasi: 4, penampilan: 4,
      pengetahuan_pekerjaan: 3, keterampilan: 4, pengalaman_kerja: 4, hasil_interview: "Recommended",
      keterangan_banding: "-", list_diajukan_ke_user: "Ya", status: "Recommended", hire_status: "-",
    },
    {
      id: "int_2", turnover_id: "to_1", nama_koordinator: "Jeje", tenggat_waktu_proses: 5,
      tanggal_pkwt: "-", tanggal_interview: todayMinus(1), nama_kandidat: "Elyani Feronica", no_hp: "081298765432",
      posisi_yang_dilamar: "Office Boy", domisili: "Jakarta Pusat", pendidikan: "SMA/K", jurusan: "-",
      agama: "Kristen", tanggal_lahir: "2000-01-20", info_loker: "Referensi Internal", keterangan_referensi: "Karyawan lama",
      keterangan_interview: "Masih menunggu keputusan user.", komunikasi: 3, penampilan: 3,
      pengetahuan_pekerjaan: 3, keterampilan: 3, pengalaman_kerja: 2, hasil_interview: "Considered",
      keterangan_banding: "-", list_diajukan_ke_user: "Ya", status: "Pending", hire_status: "-",
    },
    {
      id: "int_3", turnover_id: "to_3", nama_koordinator: "Ananda", tenggat_waktu_proses: 10,
      tanggal_pkwt: "-", tanggal_interview: todayMinus(8), nama_kandidat: "Ahmad Yani", no_hp: "081211122233",
      posisi_yang_dilamar: "Teknisi AC", domisili: "Tangerang", pendidikan: "D3", jurusan: "Teknik Mesin",
      agama: "Islam", tanggal_lahir: "1996-09-05", info_loker: "Jobstreet", keterangan_referensi: "-",
      keterangan_interview: "Pengalaman kurang sesuai kebutuhan.", komunikasi: 2, penampilan: 3,
      pengetahuan_pekerjaan: 2, keterampilan: 2, pengalaman_kerja: 2, hasil_interview: "Not Recommended",
      keterangan_banding: "-", list_diajukan_ke_user: "Tidak", status: "Not Recommended", hire_status: "Not Hired",
    },
  ];

  const id_card_process = [
    { id: "idc_1", recruitment_id: "int_1", nama_karyawan: "Ariel Garren", jabatan: "Administrasi", nomor_karyawan: "20260001", tanggal_mulai: todayMinus(1), file_name: "-", photo_data_url: "", status: "Pending", catatan: "-" },
    { id: "idc_2", recruitment_id: "int_2", nama_karyawan: "Joko Anwar", jabatan: "Office Boy", nomor_karyawan: "20260002", tanggal_mulai: todayMinus(4), file_name: "-", photo_data_url: "", status: "Completed", catatan: "-" },
  ];

  const notifications = [
    { id: "notif_1", type: "ers", title: "ERS baru diajukan", message: "TEKNISI AC — Kantor Pusat (00003/OPR BCA.1/ERS/2026)", related_id: "ers_3", created_at: `${todayMinus(10)}T14:38:05.000Z` },
    { id: "notif_2", type: "turnover", title: "Turnover disetujui", message: "ADMINISTRASI — Elyani Feronica (TO/2026/002)", related_id: "to_2", created_at: `${todayMinus(6)}T11:10:00.000Z` },
    { id: "notif_3", type: "interview", title: "Interview dijadwalkan", message: `Budi Santoso — Administrasi pada ${todayMinus(2)}`, related_id: "int_1", created_at: `${todayMinus(2)}T09:00:00.000Z` },
    { id: "notif_4", type: "idcard", title: "ID Card selesai diproses", message: "Joko Anwar — Office Boy (20260002)", related_id: "idc_2", created_at: `${todayMinus(4)}T16:20:00.000Z` },
  ];

  return {
    users, ers_document, turnover, interview_harian, id_card_process, notifications,
    interview_candidates: [], interview_candidate_history: [],
  };
}

function loadDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through to reseed
    }
  }
  const fresh = seed();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Mirrors the real Supabase triggers in supabase/schema.sql (notify_*
// functions) so demo mode behaves the same way before you ever connect a
// real project: every important action drops a row into the shared
// activity feed that the Header bell reads from.
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

function delay(ms = 120) {
  return new Promise((res) => setTimeout(res, ms));
}

// ---- Demo credentials (email -> password) -----------------------------
const DEMO_CREDENTIALS = {
  "admin@dpi.co.id": "admin123",
  "ops@dpi.co.id": "ops123",
  "er@dpi.co.id": "er123",
  "recruitment@dpi.co.id": "rec123",
  "training@dpi.co.id": "train123",
  "payroll@dpi.co.id": "pay123",
};

export const mockAdapter = {
  DEMO_CREDENTIALS,

  async signIn(email, password) {
    await delay();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || DEMO_CREDENTIALS[user.email] !== password) {
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
    // Divisi selalu tetap OPS_DIVISI ("OPR BCA.1") -- hanya OPR yang boleh
    // membuat ERS, jadi nilai kiriman form (jika ada) diabaikan.
    const divisi = OPS_DIVISI;
    // Nomor ERS mengikuti pola dokumen asli: {urut}/{Divisi}/ERS/{tahun}.
    const seqInDivisi = db.ers_document.filter((e) => e.divisi === divisi).length + 1;
    const nomor_ers = `${String(seqInDivisi).padStart(5, "0")}/${divisi}/ERS/${now.getFullYear()}`;
    const rec = {
      id: uid("ers"),
      nomor_ers,
      divisi,
      disetujui_1: ERS_DISETUJUI_1_DEFAULT,
      diterima_oleh: ERS_DITERIMA_DEFAULT,
      status: "Pending",
      created_at: now.toISOString().slice(0, 10), // dipakai untuk filter tanggal
      submitted_at: now.toISOString(), // timestamp lengkap, dipakai di kolom "Pemohon" pada PDF
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
    if (rec) rec.status = status;
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

  async createTurnover(payload) {
    await delay();
    const db = loadDb();
    // Mirrors trg_turnover_check_ers_accepted: a turnover can only be
    // created against an already-Accepted ERS document, and that ERS
    // can't already be "used up" by another Accepted turnover.
    const ers = payload.ers_document_id ? db.ers_document.find((e) => e.id === payload.ers_document_id) : null;
    if (!ers) {
      throw new Error("Turnover harus memilih dokumen ERS yang sudah Accepted terlebih dahulu.");
    }
    if (ers.status !== "Accepted") {
      throw new Error("Dokumen ERS yang dipilih belum Accepted, turnover tidak bisa dibuat.");
    }
    const alreadyUsed = db.turnover.find((t) => t.ers_document_id === ers.id && t.status === "Accepted");
    if (alreadyUsed) {
      throw new Error(`Dokumen ERS ini sudah dipakai pada turnover ${alreadyUsed.nomor_turnover} yang sudah Accepted, tidak bisa dipakai lagi.`);
    }
    const rec = {
      id: uid("to"),
      nomor_turnover: `TO/2026/${String(db.turnover.length + 1).padStart(3, "0")}`,
      status: "Pending",
      tanggal_permintaan: new Date().toISOString().slice(0, 10),
      ...payload,
    };
    db.turnover.unshift(rec);
    saveDb(db);
    return rec;
  },

  async updateTurnoverStatus(id, status, extra = {}) {
    await delay();
    const db = loadDb();
    const rec = db.turnover.find((t) => t.id === id);
    if (rec) {
      const changed = rec.status !== status;
      Object.assign(rec, { status }, extra);
      if (changed && (status === "Accepted" || status === "Rejected")) {
        pushNotification(
          db,
          "turnover",
          status === "Accepted" ? "Turnover disetujui" : "Turnover ditolak",
          `${rec.jabatan || "-"} — ${rec.nama_karyawan_existing || "-"} (${rec.nomor_turnover})`,
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
      .map((i) => ({ ...i, turnover: db.turnover.find((t) => t.id === i.turnover_id) }))
      .sort((a, b) => (a.tanggal_interview < b.tanggal_interview ? 1 : -1));
  },

  async createInterview(payload) {
    await delay();
    const db = loadDb();
    // Mirrors trg_interview_check_turnover_open: a turnover that already
    // has a hired candidate is closed, no new interview rows allowed.
    if (payload.turnover_id) {
      const t = db.turnover.find((x) => x.id === payload.turnover_id);
      if (t?.nama_karyawan_baru) {
        throw new Error(`Turnover ini sudah memiliki kandidat yang Hired (${t.nama_karyawan_baru}), tidak bisa menambah interview baru.`);
      }
    }
    const rec = { id: uid("int"), status: payload.hasil_interview || "Pending", hire_status: "-", ...payload };
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
    Object.assign(rec, patch);
    // keep the linked turnover's "karyawan baru" in sync with the hire
    // decision, same as the trg_turnover_sync_karyawan_baru trigger does
    // for real Supabase.
    if (rec.turnover_id && "hire_status" in patch) {
      const t = db.turnover.find((x) => x.id === rec.turnover_id);
      if (t) {
        if (rec.hire_status === "Hired") {
          t.nama_karyawan_baru = rec.nama_kandidat;
        } else if (prevHireStatus === "Hired" && t.nama_karyawan_baru === rec.nama_kandidat) {
          t.nama_karyawan_baru = null;
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
      // trg_interview_harian_auto_not_hire_siblings: every OTHER candidate
      // interviewed for this same turnover is no longer needed once one is
      // Hired -- auto-flip them to Not Hired (this in turn feeds the
      // candidate pool below, same as the real trigger cascade does).
      db.interview_harian
        .filter((i) => i.turnover_id === rec.turnover_id && i.id !== rec.id && i.hire_status !== "Hired")
        .forEach((sibling) => {
          const siblingPrev = sibling.hire_status;
          sibling.hire_status = "Not Hired";
          if (siblingPrev !== "Not Hired") syncCandidatePool(db, sibling);
        });
    }
    if ("hire_status" in patch && rec.hire_status === "Not Hired" && prevHireStatus !== "Not Hired") {
      syncCandidatePool(db, rec);
    }
    saveDb(db);
    return rec;
  },

  async listCandidates() {
    await delay();
    const db = loadDb();
    return [...(db.interview_candidates || [])].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  },

  async listCandidateHistory(candidateId) {
    await delay();
    const db = loadDb();
    return (db.interview_candidate_history || [])
      .filter((h) => h.candidate_id === candidateId)
      .map((h) => ({ ...h, turnover: db.turnover.find((t) => t.id === h.turnover_id) }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
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
    // Nomor induk karyawan sederhana: {tahun}{urut 4 digit}, mis. "20260007".
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

// Mirrors trg_interview_harian_sync_candidate_pool: whenever an interview's
// hire_status becomes "Not Hired", save the candidate into the reusable
// pool (matched by no_hp, else by name+birthdate, else a new pool row) and
// log the outcome into their history, instead of losing the data inside a
// single rejected interview row.
function syncCandidatePool(db, interview) {
  db.interview_candidates = db.interview_candidates || [];
  db.interview_candidate_history = db.interview_candidate_history || [];

  const cleanPhone = (interview.no_hp || "").trim();
  let candidate = null;
  if (cleanPhone && cleanPhone !== "-") {
    candidate = db.interview_candidates.find((c) => (c.no_hp || "").trim() === cleanPhone);
  } else {
    candidate = db.interview_candidates.find(
      (c) =>
        (c.nama_kandidat || "").trim().toLowerCase() === (interview.nama_kandidat || "").trim().toLowerCase() &&
        (c.tanggal_lahir || null) === (interview.tanggal_lahir || null)
    );
  }

  if (!candidate) {
    candidate = {
      id: uid("cand"),
      nama_kandidat: interview.nama_kandidat,
      no_hp: interview.no_hp,
      domisili: interview.domisili,
      pendidikan: interview.pendidikan,
      jurusan: interview.jurusan,
      agama: interview.agama,
      tanggal_lahir: interview.tanggal_lahir,
      info_loker: interview.info_loker,
      keterangan_referensi: interview.keterangan_referensi,
      posisi_terakhir_dilamar: interview.posisi_yang_dilamar,
      komunikasi: interview.komunikasi,
      penampilan: interview.penampilan,
      pengetahuan_pekerjaan: interview.pengetahuan_pekerjaan,
      keterampilan: interview.keterampilan,
      pengalaman_kerja: interview.pengalaman_kerja,
      hasil_interview: interview.hasil_interview,
      keterangan_interview: interview.keterangan_interview,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.interview_candidates.unshift(candidate);
  } else {
    candidate.nama_kandidat = interview.nama_kandidat;
    candidate.no_hp = interview.no_hp || candidate.no_hp;
    candidate.domisili = interview.domisili || candidate.domisili;
    candidate.pendidikan = interview.pendidikan || candidate.pendidikan;
    candidate.jurusan = interview.jurusan || candidate.jurusan;
    candidate.agama = interview.agama || candidate.agama;
    candidate.tanggal_lahir = interview.tanggal_lahir || candidate.tanggal_lahir;
    candidate.info_loker = interview.info_loker || candidate.info_loker;
    candidate.keterangan_referensi = interview.keterangan_referensi || candidate.keterangan_referensi;
    candidate.posisi_terakhir_dilamar = interview.posisi_yang_dilamar || candidate.posisi_terakhir_dilamar;
    candidate.komunikasi = interview.komunikasi ?? candidate.komunikasi;
    candidate.penampilan = interview.penampilan ?? candidate.penampilan;
    candidate.pengetahuan_pekerjaan = interview.pengetahuan_pekerjaan ?? candidate.pengetahuan_pekerjaan;
    candidate.keterampilan = interview.keterampilan ?? candidate.keterampilan;
    candidate.pengalaman_kerja = interview.pengalaman_kerja ?? candidate.pengalaman_kerja;
    candidate.hasil_interview = interview.hasil_interview || candidate.hasil_interview;
    candidate.keterangan_interview = interview.keterangan_interview || candidate.keterangan_interview;
    candidate.updated_at = new Date().toISOString();
  }

  db.interview_candidate_history.unshift({
    id: uid("candhist"),
    candidate_id: candidate.id,
    interview_harian_id: interview.id,
    turnover_id: interview.turnover_id,
    posisi_yang_dilamar: interview.posisi_yang_dilamar,
    tanggal_interview: interview.tanggal_interview,
    hasil_interview: interview.hasil_interview,
    hire_status: interview.hire_status,
    created_at: new Date().toISOString(),
  });
}

function inRange(dateStr, from, to) {
  if (!dateStr || dateStr === "-") return true;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}
