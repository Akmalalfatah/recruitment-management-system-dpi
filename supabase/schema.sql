-- =========================================================================
-- DPI Recruitment & Turnover System - Supabase schema
-- Run this whole file once in Supabase SQL editor on a fresh project.
-- Simple, free-tier friendly: Supabase Auth (email/password) + RLS by role.
--
-- Revised version — fixes vs. the original draft (validated against a real
-- Postgres instance running the exact insert/select calls src/lib/db.js
-- sends):
--   1. `interview_result` enum was missing 'Considered' (the form offers
--      Recommended / Considered / Not Recommended -> every "Considered"
--      submission would fail).
--   2. `interview_harian` was missing the `hire_status` column that
--      Recruitment's "Tandai Hired / Not Hired" action writes to.
--   3. `nomor_ers` / `nomor_turnover` were NOT NULL with no default, but
--      the actual OPS forms never send them (only the localStorage demo
--      adapter auto-generated them) -> every real insert would fail with
--      a not-null violation. Added auto-numbering triggers.
--   4. `id_card_process` insert only ever receives `recruitment_id` +
--      `status` from the app (Recruitment's "Tandai Hired" action) -> the
--      display fields (nama_karyawan, jabatan, tanggal_mulai) were only
--      ever filled in by the demo adapter, never for real Supabase. Added
--      a trigger that copies them from the linked interview automatically.
--   5. RLS on `interview_harian` SELECT only allowed Recruitment, but the
--      shared turnover list component also reads it for Employee Relation
--      and Payroll (to show the "Karyawan Baru" column) -> added read
--      access for those two roles.
--   6. RLS on `id_card_process` INSERT only allowed Training, but it's
--      Recruitment who creates the row (via "Tandai Hired") -> added
--      insert access for Recruitment.
--   7. auth_role()/auth_area() helper functions made SECURITY DEFINER
--      (Supabase's recommended pattern for RLS helper functions) so they
--      read `users` without depending on RLS on that same table.
--
-- v3 changes (area handling):
--   - Removed the `areas` master table + dropdown. "Area Penempatan" is now
--     free text the user types directly on each ERS/Turnover form, matching
--     the actual UI (it was wrongly modeled as a lookup table before).
--   - Removed `wilayah_penempatan` entirely — the app only needs one area
--     field, not two.
--   - `users.area_id`, `ers_document.area_id`, `turnover.area_id` (uuid FK)
--     all became a single `area_penempatan varchar(255)` column.
--   - RLS that used to compare `area_id = auth_area()` (exact uuid match)
--     now compares free-typed text case-insensitively/trimmed, since two
--     people typing "KCP Sudirman" and "kcp sudirman " should still count
--     as the same place. This is inherently a little less strict than a
--     uuid FK match — worth knowing if you'd rather scope OPS visibility
--     by `created_by = auth.uid()` instead; ask if you want that swapped.
--
-- v4 change:
--   - Added `turnover.nama_karyawan_baru` + a trigger that keeps it synced
--     whenever Recruitment marks an interview Hired/Not Hired/'-'. Before
--     this, "Karyawan Baru" was only ever guessed client-side by checking
--     hasil_interview = 'Recommended' (not the actual hire decision) and
--     was never persisted, so it wasn't reliably visible to ER/Payroll.
--
-- v5 change:
--   - Removed `turnover.nama_ctkad`. It was an OPS-fillable text field on
--     the creation form that ended up being confused with "who's the new
--     employee" — but at request time there's no candidate yet, and one
--     turnover can have many candidates (many interview_harian rows) with
--     only one ever actually hired. `nama_karyawan_baru` (v4, trigger-set
--     only when an interview is marked Hired) is the single correct place
--     for that now — nothing OPS types at creation feeds it.
--
-- v6 change:
--   - Removed area-text RLS matching entirely (auth_area() is gone). OPS
--     scoping now checks `uploaded_by`/`created_by = auth.uid()` instead.
--     Found via testing: if OPS creates an ERS/Turnover for an area whose
--     text doesn't exactly match their own profile's area_penempatan (an
--     easy thing to do now that area is free-typed), the old text-match
--     policy blocked the INSERT's own RETURNING clause — OPS couldn't even
--     read back the row they'd just created. Matching on creator instead
--     sidesteps that completely and needs no text comparison at all.
--
-- v7 change (real Supabase, nothing static):
--   - Added `id_card_process.photo_data_url` (text). The Training ID Card
--     screen (src/pages/training/IdCardList.jsx) reads the uploaded photo
--     client-side as a base64 data: URL and sends it straight to
--     idCardApi.update() — this column was missing entirely, so every real
--     photo upload against Supabase would have failed with an "unknown
--     column" error even though it worked fine against the localStorage
--     demo adapter.
--   - Added `notifications` + `notification_reads` tables, five triggers
--     (ERS created, turnover accepted/rejected, interview scheduled,
--     candidate hired, ID card completed) that auto-populate the feed on
--     real data changes, a `my_notifications` view (adds a per-user
--     `is_read` flag), and a `mark_all_notifications_read()` RPC. This
--     replaces the hardcoded `initialNotifications` array that used to
--     live in src/components/layout/Header.jsx.
--   - Enabled Postgres Realtime on `notifications` so the bell badge
--     updates live for everyone the moment something happens, without a
--     page refresh.
--
-- v8 fix (RLS 42501 on every trigger-driven insert, not just ERS):
--   Every "auto" write done by a trigger — the 5 notify_* functions, the
--   ERS/Turnover auto-numbering, and the id_card_process autofill — was
--   missing SECURITY DEFINER. A PL/pgSQL function defaults to SECURITY
--   INVOKER, meaning it runs with the CALLING user's own RLS visibility,
--   not the table owner's. Concretely this broke two different ways:
--     1. `notifications` has no INSERT policy for `authenticated` at all,
--        so any trigger that tried to insert a notification row failed
--        outright with 42501 — this hit ERS create, Turnover accept/
--        reject, Interview create, candidate Hired, and ID Card Completed
--        equally; ERS was just the first one anyone happened to trigger.
--     2. The ERS/Turnover numbering triggers do `select count(*) ...` on
--        their own table to compute the next sequence number, but OPS's
--        SELECT policy on both tables only shows rows THEY created — so
--        the count was silently scoped to just their own past submissions
--        instead of every OPS user's, which would eventually produce a
--        duplicate `nomor_ers`/`nomor_turnover` and fail on the UNIQUE
--        constraint instead of RLS. Same root cause, different symptom.
--   Fix: every trigger/helper function that reads or writes a table beyond
--   the single row it's already authorized to touch is now explicitly
--   `security definer set search_path = public`, matching the pattern
--   `turnover_sync_karyawan_baru`/`auth_role` already used correctly.
--
-- v9 change (business-rule fixes requested for the Recruitment/OPS flow):
--   1. Interview harian: a turnover can still have many interview_harian
--      rows (many candidates), but the moment ONE is marked "Hired" the
--      rest of that turnover's candidates now auto-flip to "Not Hired"
--      (trigger `interview_harian_auto_not_hire_siblings`), and a turnover
--      that already has a hired candidate (`nama_karyawan_baru` set) can no
--      longer receive new interview_harian rows at all (trigger
--      `interview_check_turnover_open`, enforced on INSERT) — the
--      replacement search for that turnover is done.
--   2. New tables `interview_candidates` + `interview_candidate_history`:
--      a reusable candidate pool ("Data Peserta Wawancara"). Whenever an
--      interview_harian row's hire_status becomes "Not Hired" (whether the
--      user set it directly or it was auto-set by #1 above), the
--      candidate's personal data + latest scores/result are upserted into
--      `interview_candidates` (matched by no_hp, falling back to
--      name+birthdate) and a row is appended to
--      `interview_candidate_history` recording which turnover/position
--      they were evaluated for and the outcome — so the same person can be
--      reconsidered for a future, similar-job turnover instead of the data
--      just sitting unused inside a rejected interview row. Trigger:
--      `interview_harian_sync_candidate_pool`.
--   3. Turnover: OPS can no longer create a turnover without picking an
--      Accepted ERS document — trigger `turnover_check_ers_accepted`
--      raises on INSERT if `ers_document_id` is null or the referenced ERS
--      isn't `Accepted` yet. That same trigger also blocks reusing an ERS
--      that's already "used up" — one whose own turnover has already
--      reached `Accepted` — so one ERS can't be recycled into more than
--      one accepted turnover request.
--   4. ERS: OPS can no longer accept/reject their own ERS. `ers_update`
--      RLS now only allows `HR_Recruitment` and `Super_Admin` to change an
--      ERS's status; OPS keeps read/insert only.
--   5. ERS document gains three signature-block columns:
--      `disetujui_1_nama` (defaults to "R. STEVE TIYANTOKO"),
--      `disetujui_2_nama` (no default, typed by OPS),
--      `diterima_nama` (defaults to "AGARISMAN KRISTOAJI") — together with
--      `pemohon_nama`, all four are editable text fields on the ERS form,
--      just pre-filled with sensible defaults so OPS rarely has to retype
--      them. These feed the "PEMOHON / DISETUJUI-1 / DISETUJUI-2 /
--      DITERIMA" signature columns on the printed ERS PDF, which used to
--      always render blank except Pemohon.
--
-- This whole file is safe to re-run on a project that already has an
-- earlier version of this schema — it drops its own objects first.
-- =========================================================================

-- ---------- Reset (safe to re-run) ----------
drop view if exists my_notifications cascade;
drop table if exists notification_reads cascade;
drop table if exists notifications cascade;
drop table if exists id_card_process cascade;
drop table if exists interview_candidate_history cascade;
drop table if exists interview_candidates cascade;
drop table if exists interview_harian cascade;
drop table if exists turnover cascade;
drop table if exists ers_document cascade;
drop table if exists users cascade;
drop table if exists areas cascade;
drop type if exists user_role cascade;
drop type if exists user_status cascade;
drop type if exists doc_status cascade;
drop type if exists idcard_status cascade;
drop type if exists interview_result cascade;
drop type if exists hire_status_type cascade;
drop function if exists auth_role() cascade;
drop function if exists auth_area() cascade;
drop function if exists next_doc_number(text, regclass, text) cascade;
drop function if exists ers_document_set_nomor() cascade;
drop function if exists turnover_set_nomor() cascade;
drop function if exists turnover_check_ers_accepted() cascade;
drop function if exists id_card_process_autofill() cascade;
drop function if exists turnover_sync_karyawan_baru() cascade;
drop function if exists interview_check_turnover_open() cascade;
drop function if exists interview_harian_auto_not_hire_siblings() cascade;
drop function if exists interview_harian_sync_candidate_pool() cascade;
drop function if exists set_updated_at() cascade;
drop function if exists create_notification(varchar, varchar, text, uuid) cascade;
drop function if exists notify_ers_created() cascade;
drop function if exists notify_turnover_status() cascade;
drop function if exists notify_interview_created() cascade;
drop function if exists notify_interview_hired() cascade;
drop function if exists notify_idcard_completed() cascade;
drop function if exists mark_all_notifications_read() cascade;
drop policy if exists "Authenticated read ers-documents" on storage.objects;
drop policy if exists "Authenticated upload ers-documents" on storage.objects;
drop policy if exists "Authenticated read idcard-photos" on storage.objects;
drop policy if exists "Authenticated upload idcard-photos" on storage.objects;

-- ---------- Enums ----------
create type user_role as enum (
  'Super_Admin', 'OPS', 'HR_ER', 'HR_Recruitment', 'HR_Training', 'HR_Payroll'
);
create type user_status as enum ('Active', 'Inactive');
create type doc_status as enum ('Pending', 'Accepted', 'Rejected');
create type idcard_status as enum ('Pending', 'In Progress', 'Completed');
create type interview_result as enum ('Recommended', 'Considered', 'Not Recommended');
create type hire_status_type as enum ('-', 'Hired', 'Not Hired');

-- ---------- Users (profile row, 1:1 with auth.users) ----------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  area_penempatan varchar(255),
  name varchar(255) not null,
  email varchar(255) unique not null,
  role user_role not null,
  status user_status not null default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- ERS documents ----------
create table ers_document (
  id uuid primary key default gen_random_uuid(),
  nomor_ers varchar(50) unique, -- auto-filled by trigger below if not supplied, pattern {seq}/{divisi}/ERS/{year}
  divisi varchar(255), -- selalu "OPR BCA.1": hanya divisi OPR yang berwenang membuat ERS (lihat OPS_DIVISI di src/lib/constants.js), bukan input bebas dari form
  uploaded_by uuid references users (id),
  pemohon_nama varchar(255), -- snapshot of the requester's name at submission time, for the printed "Pemohon" signature column
  area_penempatan varchar(255), -- "Lokasi Penempatan Kerja" on the printed ERS
  wilayah_penempatan_kerja varchar(100), -- e.g. "KANWIL 11"
  nama_karyawan_existing varchar(255),
  jabatan varchar(100),
  status_karyawan varchar(50),
  usia varchar(50), -- free text, e.g. "MAX. 25 TAHUN" (matches the paper form; not a bare number)
  tanggal_aktif_diminta date,
  alasan_ers varchar(100),
  jenis_kontrak_project varchar(255),
  kualifikasi varchar(255),
  keahlian varchar(255),
  bahasa varchar(255),
  sertifikat varchar(255),
  file_name varchar(255), -- optional: kept for future use (e.g. re-uploading a signed scan), not required at creation
  file_path varchar(255), -- storage object path, private bucket (see below)
  disetujui_1_nama varchar(255) default 'R. STEVE TIYANTOKO', -- "DISETUJUI-1 / DIVISION HEAD" signature name, auto-filled
  disetujui_2_nama varchar(255), -- "DISETUJUI-2 / DIRECTOR" signature name, typed by OPS on the form (no fixed default)
  diterima_nama varchar(255) default 'AGARISMAN KRISTOAJI', -- "DITERIMA / HR DIVISION HEAD" signature name, auto-filled
  status doc_status not null default 'Pending',
  created_at timestamptz default now(), -- Issued Date, filled automatically at submit time
  submitted_at timestamptz default now() -- exact submission timestamp shown under "Pemohon" on the printed PDF
);

-- ---------- Turnover requests ----------
create table turnover (
  id uuid primary key default gen_random_uuid(),
  nomor_turnover varchar(50) unique, -- auto-filled by trigger below if not supplied
  area_penempatan varchar(255),
  created_by uuid references users (id),
  ers_document_id uuid references ers_document (id),
  jabatan varchar(100) not null,
  nama_karyawan_existing varchar(255) not null,
  alasan_keluar varchar(100),
  nama_rekruter varchar(255),
  nama_koordinator varchar(255),
  tanggal_permintaan date not null default current_date,
  tanggal_keluar date,
  tgl_kirim_kandidat date,
  tgl_interview_user date,
  tgl_pkwt date,               -- simple extra field per PKWT requirement
  tgl_aktif_kerja date,
  nama_user varchar(255),
  keterangan_proses text,
  nama_karyawan_baru varchar(255), -- auto-synced by trigger below when a linked interview is marked Hired
  status doc_status not null default 'Pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Interview harian ----------
create table interview_harian (
  id uuid primary key default gen_random_uuid(),
  turnover_id uuid references turnover (id),
  nama_koordinator varchar(255),
  tenggat_waktu_proses int,
  tanggal_interview date,
  nama_kandidat varchar(255) not null,
  no_hp varchar(20),
  posisi_yang_dilamar varchar(100),
  domisili varchar(255),
  pendidikan varchar(20),
  jurusan varchar(150),
  agama varchar(30),
  tanggal_lahir date,
  info_loker varchar(50),
  keterangan_referensi varchar(255),
  keterangan_interview text,
  komunikasi smallint check (komunikasi between 1 and 5),
  penampilan smallint check (penampilan between 1 and 5),
  pengetahuan_pekerjaan smallint check (pengetahuan_pekerjaan between 1 and 5),
  keterampilan smallint check (keterampilan between 1 and 5),
  pengalaman_kerja smallint check (pengalaman_kerja between 1 and 5),
  hasil_interview interview_result,
  keterangan_banding text,
  list_diajukan_ke_user varchar(10),
  status varchar(30) default 'Pending',
  hire_status hire_status_type not null default '-',
  created_at timestamptz default now()
);

-- ---------- ID card process ----------
create table id_card_process (
  id uuid primary key default gen_random_uuid(),
  recruitment_id uuid references interview_harian (id),
  nama_karyawan varchar(255),
  jabatan varchar(100),
  nomor_karyawan varchar(50), -- auto-filled by trigger below, pattern {year}{seq 4 digits}
  tanggal_mulai date,
  file_name varchar(255),
  file_path varchar(255), -- storage object path for the uploaded employee photo (private bucket) — optional/legacy
  photo_data_url text, -- the actual photo the app uploads today: a base64 data: URL, read client-side via FileReader and drawn straight onto the ID card canvas (see src/utils/exportIdCard.js). No storage bucket round-trip needed.
  status idcard_status not null default 'Pending',
  catatan text,
  created_at timestamptz default now()
);

-- ---------- Interview candidate pool ("Data Peserta Wawancara") ----------
-- Reusable talent pool: whenever a candidate is marked "Not Hired" (either
-- directly, or auto-set because someone else got hired for the same
-- turnover), their personal data + latest scores/result are kept here,
-- detached from any specific turnover, so they can be considered again for
-- a future turnover with a similar job. `interview_candidate_history`
-- records every turnover/position they were actually evaluated for.
create table interview_candidates (
  id uuid primary key default gen_random_uuid(),
  nama_kandidat varchar(255) not null,
  no_hp varchar(20),
  domisili varchar(255),
  pendidikan varchar(20),
  jurusan varchar(150),
  agama varchar(30),
  tanggal_lahir date,
  info_loker varchar(50),
  keterangan_referensi varchar(255),
  posisi_terakhir_dilamar varchar(100),
  komunikasi smallint,
  penampilan smallint,
  pengetahuan_pekerjaan smallint,
  keterampilan smallint,
  pengalaman_kerja smallint,
  hasil_interview interview_result,
  keterangan_interview text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table interview_candidate_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references interview_candidates (id) on delete cascade,
  interview_harian_id uuid references interview_harian (id) on delete set null,
  turnover_id uuid references turnover (id) on delete set null,
  posisi_yang_dilamar varchar(100),
  tanggal_interview date,
  hasil_interview interview_result,
  hire_status hire_status_type,
  created_at timestamptz default now()
);

-- ---------- Notifications (activity feed, shared across all roles) ----------
-- One shared feed everyone can read; per-user "read" state is tracked
-- separately in notification_reads so one person reading a notification
-- doesn't mark it read for everyone else.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  type varchar(30) not null, -- 'ers' | 'turnover' | 'interview' | 'idcard'
  title varchar(255) not null,
  message text,
  related_id uuid,
  created_at timestamptz default now()
);

create table notification_reads (
  notification_id uuid references notifications (id) on delete cascade,
  user_id uuid references users (id) on delete cascade,
  read_at timestamptz default now(),
  primary key (notification_id, user_id)
);

-- =========================================================================
-- Auto-numbering: nomor_ers ("ERS/2026/001") and nomor_turnover
-- ("TO/2026/001"). The app's forms never send these — only the localStorage
-- demo adapter fakes them client-side — so real inserts need the database
-- to generate them. pg_advisory_xact_lock serializes concurrent inserts so
-- two users submitting at the same instant don't collide on the same number.
-- =========================================================================
create or replace function next_doc_number(prefix text, tbl regclass, col text) returns varchar
language plpgsql security definer set search_path = public as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int;
  result varchar;
begin
  perform pg_advisory_xact_lock(hashtext(prefix));
  execute format('select count(*) + 1 from %s where %I like %L', tbl, col, prefix || '/' || yr || '/%')
    into seq;
  result := prefix || '/' || yr || '/' || lpad(seq::text, 3, '0');
  return result;
end;
$$;

-- ERS numbering follows the paper form's own pattern: {seq}/{Divisi}/ERS/{year},
-- e.g. "03614/OPR BCA.1/ERS/2026" -- sequence restarts per divisi, not global.
create or replace function ers_document_set_nomor() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int;
begin
  if new.nomor_ers is null then
    perform pg_advisory_xact_lock(hashtext(coalesce(new.divisi, '')));
    select count(*) + 1 into seq
      from ers_document
      where coalesce(divisi, '') = coalesce(new.divisi, '')
        and nomor_ers like '%/' || yr;
    new.nomor_ers := lpad(seq::text, 5, '0') || '/' || coalesce(new.divisi, '-') || '/ERS/' || yr;
  end if;
  return new;
end;
$$;
create trigger trg_ers_document_set_nomor
  before insert on ers_document
  for each row execute function ers_document_set_nomor();

create or replace function turnover_set_nomor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.nomor_turnover is null then
    new.nomor_turnover := next_doc_number('TO', 'turnover', 'nomor_turnover');
  end if;
  return new;
end;
$$;
create trigger trg_turnover_set_nomor
  before insert on turnover
  for each row execute function turnover_set_nomor();

-- =========================================================================
-- A turnover can only be created against an Accepted ERS document — OPS
-- needs a real, already-approved ERS to point to, and only Recruitment can
-- accept an ERS (see RLS below), so this closes the loop server-side too
-- (not just hiding non-Accepted ERS from the dropdown client-side).
-- It also can't be an ERS that's already "used up" — one whose own
-- turnover has already reached Accepted status (ER approved the
-- replacement process for it) — otherwise the same ERS could be recycled
-- into multiple parallel turnover requests.
-- =========================================================================
create or replace function turnover_check_ers_accepted() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ers_status doc_status;
  already_used_turnover varchar(255);
begin
  if new.ers_document_id is null then
    raise exception 'Turnover harus memilih dokumen ERS yang sudah Accepted terlebih dahulu.';
  end if;
  select status into ers_status from ers_document where id = new.ers_document_id;
  if ers_status is null then
    raise exception 'Dokumen ERS yang dipilih tidak ditemukan.';
  end if;
  if ers_status is distinct from 'Accepted' then
    raise exception 'Dokumen ERS yang dipilih belum Accepted, turnover tidak bisa dibuat.';
  end if;
  select nomor_turnover into already_used_turnover
    from turnover where ers_document_id = new.ers_document_id and status = 'Accepted' limit 1;
  if already_used_turnover is not null then
    raise exception 'Dokumen ERS ini sudah dipakai pada turnover % yang sudah Accepted, tidak bisa dipakai lagi.', already_used_turnover;
  end if;
  return new;
end;
$$;
create trigger trg_turnover_check_ers_accepted
  before insert on turnover
  for each row execute function turnover_check_ers_accepted();

-- =========================================================================
-- Auto-fill id_card_process from the linked interview when Recruitment
-- marks a candidate Hired (the app only sends recruitment_id + status).
-- =========================================================================
create or replace function id_card_process_autofill() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  iv interview_harian%rowtype;
  yr text := to_char(now(), 'YYYY');
  seq int;
begin
  if new.recruitment_id is not null then
    select * into iv from interview_harian where id = new.recruitment_id;
    if found then
      new.nama_karyawan := coalesce(new.nama_karyawan, iv.nama_kandidat);
      new.jabatan := coalesce(new.jabatan, iv.posisi_yang_dilamar);
    end if;
  end if;
  new.tanggal_mulai := coalesce(new.tanggal_mulai, current_date);
  new.file_name := coalesce(new.file_name, '-');
  new.catatan := coalesce(new.catatan, '-');
  if new.nomor_karyawan is null then
    perform pg_advisory_xact_lock(hashtext('id_card_process_nomor_karyawan'));
    select count(*) + 1 into seq from id_card_process where nomor_karyawan like yr || '%';
    new.nomor_karyawan := yr || lpad(seq::text, 4, '0');
  end if;
  return new;
end;
$$;
create trigger trg_id_card_process_autofill
  before insert on id_card_process
  for each row execute function id_card_process_autofill();

-- =========================================================================
-- Keep turnover.nama_karyawan_baru in sync with hiring decisions. When
-- Recruitment marks a candidate "Hired" in Interview Harian, the linked
-- Turnover request should immediately show who the new employee is; if a
-- hire decision is later corrected away from "Hired", clear it back out.
-- SECURITY DEFINER because Recruitment can update interview_harian but is
-- intentionally NOT allowed to update turnover directly (that's OPS/ER's
-- job) — this trigger is a narrow, automatic exception scoped to just this
-- one field, not a broader permission grant.
-- =========================================================================
create or replace function turnover_sync_karyawan_baru() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.turnover_id is not null then
    if new.hire_status = 'Hired' then
      update turnover set nama_karyawan_baru = new.nama_kandidat where id = new.turnover_id;
    elsif old.hire_status = 'Hired' and new.hire_status is distinct from 'Hired' then
      update turnover set nama_karyawan_baru = null
        where id = new.turnover_id and nama_karyawan_baru = old.nama_kandidat;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_turnover_sync_karyawan_baru
  after update on interview_harian
  for each row execute function turnover_sync_karyawan_baru();

-- =========================================================================
-- A turnover exists to find ONE replacement. Once a candidate has been
-- marked Hired for it (turnover.nama_karyawan_baru is set), the search is
-- over — block new interview_harian rows against that turnover_id.
-- =========================================================================
create or replace function interview_check_turnover_open() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  already_hired varchar(255);
begin
  if new.turnover_id is not null then
    select nama_karyawan_baru into already_hired from turnover where id = new.turnover_id;
    if already_hired is not null then
      raise exception 'Turnover ini sudah memiliki kandidat yang Hired (%), tidak bisa menambah interview baru.', already_hired;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_interview_check_turnover_open
  before insert on interview_harian
  for each row execute function interview_check_turnover_open();

-- =========================================================================
-- The moment one candidate is marked Hired for a turnover, every OTHER
-- candidate interviewed for that same turnover is no longer needed —
-- auto-flip their hire_status to "Not Hired" so Recruitment doesn't have
-- to close them out by hand one by one. Runs AFTER trg_turnover_sync_
-- karyawan_baru (alphabetically later trigger name on the same event),
-- which is fine since that trigger only touches the `turnover` table.
-- =========================================================================
create or replace function interview_harian_auto_not_hire_siblings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.turnover_id is not null and new.hire_status = 'Hired' and old.hire_status is distinct from 'Hired' then
    update interview_harian
      set hire_status = 'Not Hired'
      where turnover_id = new.turnover_id
        and id <> new.id
        and hire_status is distinct from 'Hired';
  end if;
  return new;
end;
$$;
create trigger trg_interview_harian_auto_not_hire_siblings
  after update on interview_harian
  for each row execute function interview_harian_auto_not_hire_siblings();

-- =========================================================================
-- Interview candidate pool sync: whenever a candidate's hire_status becomes
-- "Not Hired" — set directly by Recruitment, or auto-set by the trigger
-- above — save their data into the reusable `interview_candidates` pool
-- (matched by no_hp when present, else by name+birthdate, else always a
-- new pool row) instead of letting it go to waste inside one rejected
-- interview_harian row, and log this turnover/outcome into
-- `interview_candidate_history`.
-- =========================================================================
create or replace function interview_harian_sync_candidate_pool() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cand_id uuid;
  clean_phone varchar(20);
begin
  if new.hire_status = 'Not Hired' and old.hire_status is distinct from 'Not Hired' then
    clean_phone := nullif(trim(new.no_hp), '');
    if clean_phone is not null and clean_phone <> '-' then
      select id into cand_id from interview_candidates
        where no_hp is not null and trim(no_hp) = clean_phone
        limit 1;
    else
      select id into cand_id from interview_candidates
        where lower(trim(nama_kandidat)) = lower(trim(coalesce(new.nama_kandidat, '')))
          and tanggal_lahir is not distinct from new.tanggal_lahir
        limit 1;
    end if;

    if cand_id is null then
      insert into interview_candidates (
        nama_kandidat, no_hp, domisili, pendidikan, jurusan, agama, tanggal_lahir,
        info_loker, keterangan_referensi, posisi_terakhir_dilamar,
        komunikasi, penampilan, pengetahuan_pekerjaan, keterampilan, pengalaman_kerja,
        hasil_interview, keterangan_interview
      ) values (
        new.nama_kandidat, new.no_hp, new.domisili, new.pendidikan, new.jurusan, new.agama, new.tanggal_lahir,
        new.info_loker, new.keterangan_referensi, new.posisi_yang_dilamar,
        new.komunikasi, new.penampilan, new.pengetahuan_pekerjaan, new.keterampilan, new.pengalaman_kerja,
        new.hasil_interview, new.keterangan_interview
      ) returning id into cand_id;
    else
      update interview_candidates set
        nama_kandidat = new.nama_kandidat,
        no_hp = coalesce(new.no_hp, no_hp),
        domisili = coalesce(new.domisili, domisili),
        pendidikan = coalesce(new.pendidikan, pendidikan),
        jurusan = coalesce(new.jurusan, jurusan),
        agama = coalesce(new.agama, agama),
        tanggal_lahir = coalesce(new.tanggal_lahir, tanggal_lahir),
        info_loker = coalesce(new.info_loker, info_loker),
        keterangan_referensi = coalesce(new.keterangan_referensi, keterangan_referensi),
        posisi_terakhir_dilamar = coalesce(new.posisi_yang_dilamar, posisi_terakhir_dilamar),
        komunikasi = coalesce(new.komunikasi, komunikasi),
        penampilan = coalesce(new.penampilan, penampilan),
        pengetahuan_pekerjaan = coalesce(new.pengetahuan_pekerjaan, pengetahuan_pekerjaan),
        keterampilan = coalesce(new.keterampilan, keterampilan),
        pengalaman_kerja = coalesce(new.pengalaman_kerja, pengalaman_kerja),
        hasil_interview = coalesce(new.hasil_interview, hasil_interview),
        keterangan_interview = coalesce(new.keterangan_interview, keterangan_interview),
        updated_at = now()
        where id = cand_id;
    end if;

    insert into interview_candidate_history (
      candidate_id, interview_harian_id, turnover_id, posisi_yang_dilamar,
      tanggal_interview, hasil_interview, hire_status
    ) values (
      cand_id, new.id, new.turnover_id, new.posisi_yang_dilamar,
      new.tanggal_interview, new.hasil_interview, new.hire_status
    );
  end if;
  return new;
end;
$$;
create trigger trg_interview_harian_sync_candidate_pool
  after update on interview_harian
  for each row execute function interview_harian_sync_candidate_pool();

-- keep updated_at current on turnover/users edits
create or replace function set_updated_at() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_turnover_updated_at before update on turnover
  for each row execute function set_updated_at();
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- =========================================================================
-- Notifications: auto-created by database triggers whenever something
-- happens that other modules care about, so the Header bell is fed by real
-- activity instead of a hardcoded array. `notifications` has no INSERT
-- policy for `authenticated` at all (see RLS section below — the only
-- policy on it is SELECT) — every function below is explicitly marked
-- SECURITY DEFINER so it runs as the function owner and bypasses RLS on
-- the way in. Ownership alone does NOT do this in Postgres; without the
-- SECURITY DEFINER keyword a PL/pgSQL function always runs as the calling
-- user (SECURITY INVOKER is the default), which is what caused every one
-- of these to fail with "new row violates row-level security policy for
-- table notifications" (42501) before this was added.
-- =========================================================================
create or replace function create_notification(p_type varchar, p_title varchar, p_message text, p_related_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (type, title, message, related_id) values (p_type, p_title, p_message, p_related_id);
end;
$$;

create or replace function notify_ers_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform create_notification(
    'ers', 'ERS baru diajukan',
    coalesce(new.jabatan, '-') || ' — ' || coalesce(new.area_penempatan, '-') || ' (' || coalesce(new.nomor_ers, '-') || ')',
    new.id
  );
  return new;
end;
$$;
create trigger trg_notify_ers_created after insert on ers_document
  for each row execute function notify_ers_created();

create or replace function notify_turnover_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('Accepted', 'Rejected') then
    perform create_notification(
      'turnover',
      case when new.status = 'Accepted' then 'Turnover disetujui' else 'Turnover ditolak' end,
      coalesce(new.jabatan, '-') || ' — ' || coalesce(new.nama_karyawan_existing, '-') || ' (' || coalesce(new.nomor_turnover, '-') || ')',
      new.id
    );
  end if;
  return new;
end;
$$;
create trigger trg_notify_turnover_status after update on turnover
  for each row execute function notify_turnover_status();

create or replace function notify_interview_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform create_notification(
    'interview', 'Interview dijadwalkan',
    coalesce(new.nama_kandidat, '-') || ' — ' || coalesce(new.posisi_yang_dilamar, '-') ||
      case when new.tanggal_interview is not null then ' pada ' || to_char(new.tanggal_interview, 'DD Mon YYYY') else '' end,
    new.id
  );
  return new;
end;
$$;
create trigger trg_notify_interview_created after insert on interview_harian
  for each row execute function notify_interview_created();

create or replace function notify_interview_hired() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.hire_status is distinct from old.hire_status and new.hire_status = 'Hired' then
    perform create_notification(
      'interview', 'Kandidat hired',
      coalesce(new.nama_kandidat, '-') || ' dinyatakan hired untuk posisi ' || coalesce(new.posisi_yang_dilamar, '-') ||
        '. ID Card sedang diproses Training.',
      new.id
    );
  end if;
  return new;
end;
$$;
create trigger trg_notify_interview_hired after update on interview_harian
  for each row execute function notify_interview_hired();

create or replace function notify_idcard_completed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status = 'Completed' then
    perform create_notification(
      'idcard', 'ID Card selesai diproses',
      coalesce(new.nama_karyawan, '-') || ' — ' || coalesce(new.jabatan, '-') || ' (' || coalesce(new.nomor_karyawan, '-') || ')',
      new.id
    );
  end if;
  return new;
end;
$$;
create trigger trg_notify_idcard_completed after update on id_card_process
  for each row execute function notify_idcard_completed();

-- One-shot RPC the Header calls to mark every currently-unread notification
-- as read for the logged-in user in a single round trip.
create or replace function mark_all_notifications_read() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into notification_reads (notification_id, user_id)
  select n.id, auth.uid() from notifications n
  on conflict (notification_id, user_id) do nothing;
end;
$$;

-- =========================================================================
-- Row Level Security - simple, free-tier friendly.
-- Rule of thumb: everyone can read their own area's rows for modules
-- relevant to their role; Super_Admin bypasses everything.
-- =========================================================================

alter table users enable row level security;
alter table ers_document enable row level security;
alter table turnover enable row level security;
alter table interview_harian enable row level security;
alter table interview_candidates enable row level security;
alter table interview_candidate_history enable row level security;
alter table id_card_process enable row level security;
alter table notifications enable row level security;
alter table notification_reads enable row level security;

-- helper: current user's role. SECURITY DEFINER so this read doesn't
-- itself depend on the RLS policy below (Supabase's recommended pattern
-- for RLS helper functions) — safer and faster than a plain STABLE
-- function here.
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid();
$$;

-- users: can read own row; Super_Admin can read all
create policy users_self_read on users for select using (
  id = auth.uid() or auth_role() = 'Super_Admin'
);

-- ERS: OPS sees what THEY submitted; Recruitment sees ALL of them (they're
-- the ones who accept/reject every ERS, regardless of which OPS user
-- submitted it); Super_Admin sees everything. Scoped by who created the
-- row (uploaded_by) for OPS, not by area text — area is free-typed on the
-- form, so matching on it is fragile, and since an insert's RETURNING
-- clause is itself subject to the SELECT policy, a mismatch there would
-- make OPS's own just-created row unreadable.
create policy ers_select on ers_document for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment') or (auth_role() = 'OPS' and uploaded_by = auth.uid())
);
create policy ers_insert on ers_document for insert with check (
  auth_role() in ('OPS', 'Super_Admin')
);
-- Only Recruitment (and Super_Admin) can change an ERS's status — OPS
-- cannot accept/reject its own submission, only read it back (ers_select
-- above) and create new ones (ers_insert above).
create policy ers_update on ers_document for update using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);

-- Turnover: visible to OPS (their own submissions), ER, Recruitment, Training, Payroll, Super_Admin
create policy turnover_select on turnover for select using (
  auth_role() in ('Super_Admin', 'HR_ER', 'HR_Recruitment', 'HR_Training', 'HR_Payroll') or
  (auth_role() = 'OPS' and created_by = auth.uid())
);
create policy turnover_insert on turnover for insert with check (
  auth_role() in ('OPS', 'Super_Admin')
);
-- OPS updates their own submissions; HR_ER can process/edit any turnover
create policy turnover_update on turnover for update using (
  auth_role() in ('Super_Admin', 'HR_ER') or
  (auth_role() = 'OPS' and created_by = auth.uid())
);

-- Interview harian: Recruitment manages (insert/update); Recruitment, ER
-- and Payroll can all read (ER + Payroll's turnover list shows the
-- resulting "Karyawan Baru" from the interview); Super_Admin sees all.
create policy interview_select on interview_harian for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment', 'HR_ER', 'HR_Payroll')
);
create policy interview_insert on interview_harian for insert with check (
  auth_role() in ('HR_Recruitment', 'Super_Admin')
);
create policy interview_update on interview_harian for update using (
  auth_role() in ('HR_Recruitment', 'Super_Admin')
);

-- Interview candidate pool ("Data Peserta Wawancara"): Recruitment's own
-- reusable talent pool. Nobody can INSERT/UPDATE it directly from the
-- client — every row only ever comes from the
-- interview_harian_sync_candidate_pool trigger above, which runs as the
-- table owner (SECURITY DEFINER) and bypasses RLS on the way in.
create policy interview_candidates_select on interview_candidates for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);
create policy interview_candidate_history_select on interview_candidate_history for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);

-- ID card: Training manages the queue; Recruitment can also INSERT because
-- "Tandai Hired" in the Recruitment module is what creates the row — and
-- also needs SELECT here, because the app does `insert(...).select()`,
-- which requires the actor to be able to read back the row it just made.
create policy idcard_select on id_card_process for select using (
  auth_role() in ('Super_Admin', 'HR_Training', 'HR_Recruitment')
);
create policy idcard_insert on id_card_process for insert with check (
  auth_role() in ('HR_Training', 'HR_Recruitment', 'Super_Admin')
);
create policy idcard_update on id_card_process for update using (
  auth_role() in ('HR_Training', 'Super_Admin')
);

-- Notifications: every authenticated user can read the shared activity
-- feed (it's already scoped to non-sensitive summary text). Nobody can
-- INSERT directly from the client — rows only ever come from the trigger
-- functions above, which run as the table owner and bypass RLS.
create policy notifications_select on notifications for select using (auth.uid() is not null);

-- notification_reads: each user can only see/write their own read markers.
create policy notification_reads_select on notification_reads for select using (user_id = auth.uid());
create policy notification_reads_insert on notification_reads for insert with check (user_id = auth.uid());

-- Convenience view: notifications + whether the CURRENT user has read each
-- one, newest first. This is what the Header component queries directly
-- (`select * from my_notifications limit 20`) instead of doing the
-- left-join/auth.uid() logic in JS.
create or replace view my_notifications as
select n.*, (nr.user_id is not null) as is_read
from notifications n
left join notification_reads nr on nr.notification_id = n.id and nr.user_id = auth.uid()
order by n.created_at desc;

grant select on my_notifications to authenticated;

-- =========================================================================
-- Storage: one private bucket for ERS PDFs (CV/ERS docs), one for ID card
-- photos. Both private + signed URLs, simple owner-based policy.
-- =========================================================================
insert into storage.buckets (id, name, public) values ('ers-documents', 'ers-documents', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('idcard-photos', 'idcard-photos', false)
  on conflict (id) do nothing;

create policy "Authenticated read ers-documents" on storage.objects
  for select using (bucket_id = 'ers-documents' and auth.uid() is not null);
create policy "Authenticated upload ers-documents" on storage.objects
  for insert with check (bucket_id = 'ers-documents' and auth.uid() is not null);

create policy "Authenticated read idcard-photos" on storage.objects
  for select using (bucket_id = 'idcard-photos' and auth.uid() is not null);
create policy "Authenticated upload idcard-photos" on storage.objects
  for insert with check (bucket_id = 'idcard-photos' and auth.uid() is not null);

-- =========================================================================
-- API-level grants. Needed if your project has "Automatically expose new
-- tables" turned OFF (Database -> API Settings) — which is the setting
-- Supabase itself recommends. With it off, PostgREST won't let ANY role
-- touch a new table until you grant it explicitly, regardless of RLS.
-- These grants only open the door at the table level; the RLS policies
-- above are what actually decide which rows each role can see/change, so
-- it's safe to run this block either way. Nothing is granted to `anon`
-- since this app has no public/unauthenticated access — every screen
-- requires a logged-in Supabase Auth session.
-- =========================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  users, ers_document, turnover, interview_harian, interview_candidates, interview_candidate_history,
  id_card_process, notifications, notification_reads
  to authenticated;
grant execute on function mark_all_notifications_read() to authenticated;

-- =========================================================================
-- Realtime: let the Header bell update live (new notification pops in
-- without a page refresh) instead of only refreshing on next page load.
-- Safe to re-run — ignores the error if the table is already added.
-- =========================================================================
do $$
begin
  execute 'alter publication supabase_realtime add table notifications';
exception when others then
  null;
end $$;

-- =========================================================================
-- Seed: master jabatan list is enforced in the frontend (fixed list in
-- src/lib/constants.js) rather than a lookup table, per project scope.
-- Create your first users through Supabase Auth, then insert matching
-- rows into `users` with the right role, e.g.:
--
--   insert into users (id, area_penempatan, name, email, role)
--   values ('<auth-user-uuid>', 'Kantor Pusat', 'Nama User', 'user@dpi.co.id', 'OPS');
-- =========================================================================