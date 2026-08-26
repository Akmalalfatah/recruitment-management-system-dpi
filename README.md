# DPI Recruitment & Turnover System

Website internal untuk mengelola alur **ERS (Employee Requisition Sheet)**, **permintaan turnover**, **interview harian**, dan **pembuatan ID Card**, lintas modul OPS, Employee Relation, Recruitment, Training, dan Payroll.

- **Frontend**: React (Vite) + Tailwind CSS, desktop-first
- **Backend**: Supabase (Postgres + Auth + Realtime), sepenuhnya dinamis — tidak ada data statis begitu terhubung
- **Font**: Inter
- **Warna**: primary `#3A64AF`, secondary `#F08321`, status red/green/orange/blue sesuai brief

## 1. Menjalankan secara lokal (mode demo, tanpa Supabase)

```bash
npm install
npm run dev
```

Karena `VITE_SUPABASE_URL` belum diisi, aplikasi otomatis berjalan dalam **mode demo**: seluruh data (termasuk notifikasi) disimpan di `localStorage` browser Anda. Login menggunakan salah satu akun berikut (juga ditampilkan langsung di halaman login):

| Role              | Email                 | Password       |
| ----------------- | --------------------- | -------------- |
| Akmal             | akmal@dpi.co.id       | akmal123       |
| Dhio              | dhio@dpi.co.id        | dhio123        |
| Yusuf             | yusuf@dpi.co.id       | yusuf123       |
| Super Admin       | admin@dpi.co.id       | admin123       |
| OPS               | ops@dpi.co.id         | ops123         |
| Employee Relation | er@dpi.co.id          | er123          |
| Recruitment       | recruitment@dpi.co.id | recruitment123 |
| Training          | training@dpi.co.id    | training123    |
| Payroll           | payroll@dpi.co.id     | payroll123     |

Mode demo ini murni untuk _preview_ dan hanya tersimpan di browser Anda sendiri — data tidak dibagikan antar-perangkat/akun. Begitu Anda mengisi kredensial Supabase (langkah 2), aplikasi **otomatis beralih** memakai database sungguhan tanpa perlu ubah kode apa pun.

## 2. Menghubungkan ke Supabase (supaya semuanya dinamis)

### a. Buat project & jalankan schema

1. Buat project baru di [supabase.com](https://supabase.com) (paket gratis sudah cukup).
2. Buka **SQL Editor**, buat query baru, **copy-paste seluruh isi file `supabase/schema.sql`**, lalu klik **Run**.
   - File ini membuat semua tabel (`users`, `ers_document`, `turnover`, `interview_harian`, `id_card_process`, `notifications`, `notification_reads`), enum, trigger otomatis (penomoran ERS/Turnover, sinkronisasi status, notifikasi), Row Level Security per role, dan storage bucket.
   - **Aman dijalankan ulang** — di baris paling atas file ini menghapus dulu objek-objek lamanya sebelum membuat ulang, jadi kalau Anda perlu re-run setelah update schema di kemudian hari, tinggal jalankan lagi seluruh file yang sama.
3. Copy `.env.example` menjadi `.env` di root project, isi dengan **Project URL** dan **anon public key** dari **Project Settings → API**.
4. Jalankan ulang `npm run dev`. Aplikasi kini 100% terhubung ke Supabase — tidak ada lagi data statis, termasuk dashboard, notifikasi, dan daftar akun.

### b. Membuat akun login pertama (supaya "sync" beneran)

Ini bagian yang sebelumnya terasa statis — sekarang caranya:

1. Di Supabase, buka **Authentication → Users → Add user**. Isi email + password, lalu **matikan "Auto Confirm User" biarkan tercentang** (supaya user langsung bisa login tanpa perlu verifikasi email).
2. Copy **User UID** yang baru dibuat (klik user tersebut di daftar).
3. Buka **Table Editor → `users`** (tabel profil, beda dari Authentication di atas), klik **Insert row**, isi:
   - `id` → paste User UID dari langkah 2
   - `name` → nama lengkap
   - `email` → **harus sama persis** dengan email di langkah 1
   - `role` → salah satu: `Super_Admin`, `OPS`, `HR_ER`, `HR_Recruitment`, `HR_Training`, `HR_Payroll`
   - `area_penempatan` → opsional, teks bebas (mis. "Kantor Pusat")
4. Selesai — user tersebut sudah bisa login di aplikasi dengan email/password dari langkah 1, dan role-nya menentukan menu/akses yang muncul.

**Menghapus akun**: hapus user-nya di **Authentication → Users**. Baris di tabel `users` ikut terhapus otomatis (relasi `on delete cascade`), jadi tidak ada langkah tambahan.

Karena `AuthContext` (`src/contexts/AuthContext.jsx`) mengambil sesi & profil langsung dari Supabase setiap kali dibuka, **setiap akun yang Anda tambah/hapus di atas langsung "sync" ke aplikasi** — tidak perlu redeploy atau ubah kode.

> Ingin proses tambah-akun ini punya halaman UI sendiri di dalam aplikasi (bukan lewat dashboard Supabase)? Itu bisa ditambahkan sebagai halaman "Kelola Akun" khusus Super Admin — beri tahu saya kalau ini yang Anda mau, karena butuh sedikit pertimbangan keamanan tambahan (pembuatan user baru dari browser butuh kunci khusus yang tidak boleh sekadar ditaruh di kode frontend).

### c. Notifikasi sekarang otomatis, bukan lagi hardcode

`schema.sql` menambahkan 5 trigger database yang otomatis membuat notifikasi baru setiap kali:

- ERS baru diajukan (OPS)
- Status turnover berubah jadi Accepted/Rejected
- Interview baru dijadwalkan (Recruitment)
- Kandidat ditandai Hired
- Status ID Card berubah jadi Completed

Realtime juga sudah diaktifkan untuk tabel `notifications`, jadi lonceng notifikasi di Header **update otomatis tanpa refresh halaman** setiap kali ada aktivitas baru dari siapa pun yang sedang login.

## 3. Build untuk deploy

```bash
npm run build
```

Hasil build statis ada di folder `dist/` — bisa di-deploy ke Vercel, Netlify, Supabase Hosting, atau server statis apa pun. Jangan lupa set env var `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di platform hosting-nya juga.

## Struktur proyek

```
src/
  lib/            -> konstanta domain, koneksi Supabase, data-access layer (db.js), adapter demo (mockAdapter.js)
  contexts/        -> AuthContext (session & role, live dari Supabase)
  components/
    layout/         -> Header (termasuk notifikasi live), Sidebar, AppLayout, ProtectedRoute
    common/          -> UI primitives (tombol, input, tabel, modal, badge status, filter tanggal, Logo)
    turnover/        -> komponen turnover yang dipakai lintas 5 modul
  pages/
    auth/            -> Login
    dashboard/       -> Dashboard (isi berbeda tiap role, dihitung live dari data Supabase)
    ops/             -> Daftar & Form ERS, Daftar & Form Turnover
    er/              -> Daftar Turnover (Employee Relation, bisa edit status/proses)
    recruitment/     -> Daftar Turnover (view), Interview Harian (list, form, tandai hired)
    training/        -> Daftar Turnover (view), Antrean ID Card (upload foto + generate ID card)
    payroll/         -> Daftar Turnover (view only)
  utils/            -> ekspor Excel (xlsx), ekspor PDF ERS (jsPDF), render kartu ID (canvas)
supabase/
  schema.sql        -> SATU file schema database lengkap: tabel + trigger + RLS + storage + notifikasi + realtime, copy-paste siap jalan di Supabase SQL editor
```

## Alur kerja singkat

1. **OPS** mengajukan **ERS** dan/atau **Permintaan Turnover** untuk suatu jabatan yang kosong/akan kosong. Nomor ERS/Turnover dibuat otomatis oleh database.
2. Status turnover diproses (Accepted/Rejected) — begitu berubah, notifikasi otomatis dibuat dan Employee Relation/Payroll/Recruitment bisa langsung melihatnya.
3. **Recruitment** melakukan **Interview Harian**, menilai kandidat, dan bila hasilnya baik, dapat menandai kandidat sebagai **Hired** — ini otomatis membuat antrean baru di modul **Training** dan mengirim notifikasi.
4. **Training** mengunggah foto karyawan dan men-generate **ID Card** (PNG, didesain otomatis lewat canvas) — begitu selesai, notifikasi "ID Card selesai diproses" otomatis muncul untuk semua orang yang login.

## Catatan keamanan & lingkup proyek

- Autentikasi: Supabase Auth email/password sederhana (tanpa SSO/MFA), sesuai kebutuhan proyek.
- Row Level Security per role sudah disiapkan di `supabase/schema.sql`; silakan disesuaikan lagi jika kebutuhan akses berkembang.
- Foto karyawan untuk ID Card disimpan langsung sebagai data (base64) di kolom `id_card_process.photo_data_url`, dibaca ulang oleh browser untuk digambar ke kanvas ID Card — tidak perlu bucket storage terpisah untuk foto ini.
- Master data `jabatan` masih _fixed list_ di `src/lib/constants.js` (bukan tabel database), sesuai keputusan awal proyek, agar tetap simpel.
- Menambah/menghapus akun login saat ini dilakukan lewat dashboard Supabase (lihat langkah 2b) — aplikasi langsung membaca perubahan itu secara live tanpa perlu deploy ulang.
