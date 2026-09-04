drop view if exists my_notifications cascade;
drop table if exists notification_reads cascade;
drop table if exists notifications cascade;
drop table if exists id_card_process cascade;
drop table if exists interview_turnover_log cascade;
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
drop type if exists turnover_status cascade;
drop type if exists idcard_status cascade;
drop type if exists interview_result cascade;
drop type if exists hire_status_type cascade;
drop function if exists auth_role() cascade;
drop function if exists auth_area() cascade;
drop function if exists next_doc_number(text, regclass, text) cascade;
drop function if exists ers_document_set_nomor() cascade;
drop function if exists ers_document_create_turnover() cascade;
drop function if exists turnover_set_nomor() cascade;
drop function if exists turnover_check_ers_accepted() cascade;
drop function if exists id_card_process_autofill() cascade;
drop function if exists turnover_sync_karyawan_baru() cascade;
drop function if exists interview_check_turnover_open() cascade;
drop function if exists interview_harian_auto_not_hire_siblings() cascade;
drop function if exists interview_harian_sync_candidate_pool() cascade;
drop function if exists interview_log_turnover_assignment() cascade;
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

create type user_role as enum (
  'Super_Admin', 'OPS', 'HR_ER', 'HR_Recruitment', 'HR_Training', 'HR_Payroll'
);
create type user_status as enum ('Active', 'Inactive');
create type doc_status as enum ('Pending', 'Accepted', 'Rejected');
create type turnover_status as enum (
  'Belum Kirim', 'Sudah Kirim', 'Pengurangan', 'Interview User',
  'Terpilih', 'Menunggu Info User', 'Dihold Sementara'
);
create type idcard_status as enum ('Pending', 'In Progress', 'Completed');
create type interview_result as enum ('Recommended', 'Considered', 'Not Recommended');
create type hire_status_type as enum ('-', 'Hired', 'Not Hired');
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

create table ers_document (
  id uuid primary key default gen_random_uuid(),
  nomor_ers varchar(50) unique, 
  divisi varchar(255),
  uploaded_by uuid references users (id),
  pemohon_nama varchar(255), 
  area_penempatan varchar(255), 
  wilayah_penempatan_kerja varchar(100), 
  nama_karyawan_existing varchar(255),
  jabatan varchar(100),
  status_karyawan varchar(50),
  usia varchar(50), 
  tanggal_aktif_diminta date,
  alasan_ers varchar(100),
  jenis_kontrak_project varchar(255),
  kualifikasi varchar(255),
  keahlian varchar(255),
  bahasa varchar(255),
  sertifikat varchar(255),
  file_name varchar(255), 
  file_path varchar(255), 
  disetujui_1_nama varchar(255) default 'R. STEVE TIYANTOKO', 
  disetujui_2_nama varchar(255), 
  diterima_nama varchar(255) default 'AGARISMAN KRISTOAJI', 
  status doc_status not null default 'Pending',
  created_at timestamptz default now(), 
  submitted_at timestamptz default now() 
);

create table turnover (
  id uuid primary key default gen_random_uuid(),
  nomor_turnover varchar(50) unique, 
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
  tgl_pkwt date,              
  tgl_aktif_kerja date,
  nama_user varchar(255),
  keterangan_proses text,
  nama_karyawan_baru varchar(255), 
  status turnover_status not null default 'Belum Kirim',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table id_card_process (
  id uuid primary key default gen_random_uuid(),
  recruitment_id uuid references interview_harian (id),
  nama_karyawan varchar(255),
  jabatan varchar(100),
  nomor_karyawan varchar(50), 
  tanggal_mulai date,
  file_name varchar(255),
  file_path varchar(255), 
  photo_data_url text, 
  status idcard_status not null default 'Pending',
  catatan text,
  created_at timestamptz default now()
);

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

create table interview_turnover_log (
  id uuid primary key default gen_random_uuid(),
  interview_harian_id uuid not null references interview_harian (id) on delete cascade,
  turnover_id uuid not null references turnover (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  outcome hire_status_type
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type varchar(30) not null, 
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
    from turnover where ers_document_id = new.ers_document_id limit 1;
  if already_used_turnover is not null then
    raise exception 'Dokumen ERS ini sudah memiliki turnover % — tidak bisa dibuat lagi.', already_used_turnover;
  end if;
  return new;
end;
$$;
create trigger trg_turnover_check_ers_accepted
  before insert on turnover
  for each row execute function turnover_check_ers_accepted();

create or replace function ers_document_create_turnover() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'Accepted' and old.status is distinct from 'Accepted' then
    if not exists (select 1 from turnover where ers_document_id = new.id) then
      insert into turnover (
        area_penempatan, created_by, ers_document_id, jabatan, nama_karyawan_existing, nama_user
      ) values (
        new.area_penempatan, new.uploaded_by, new.id, new.jabatan, new.nama_karyawan_existing, new.pemohon_nama
      );
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_ers_document_create_turnover
  after update on ers_document
  for each row execute function ers_document_create_turnover();

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

create or replace function turnover_sync_karyawan_baru() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.turnover_id is not null then
    if new.hire_status = 'Hired' then
      update turnover set nama_karyawan_baru = new.nama_kandidat, status = 'Terpilih' where id = new.turnover_id;
    elsif old.hire_status = 'Hired' and new.hire_status is distinct from 'Hired' then
      update turnover set nama_karyawan_baru = null, status = 'Interview User'
        where id = new.turnover_id and nama_karyawan_baru = old.nama_kandidat;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_turnover_sync_karyawan_baru
  after update on interview_harian
  for each row execute function turnover_sync_karyawan_baru();

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

create or replace function interview_log_turnover_assignment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.turnover_id is not null then
    update interview_turnover_log
      set unassigned_at = now(), outcome = new.hire_status
      where interview_harian_id = new.id and turnover_id = old.turnover_id and unassigned_at is null;
  end if;
  if new.turnover_id is not null then
    insert into interview_turnover_log (interview_harian_id, turnover_id)
      values (new.id, new.turnover_id);
  end if;
  return new;
end;
$$;
create trigger trg_interview_log_turnover_assignment
  after update on interview_harian
  for each row
  when (new.turnover_id is distinct from old.turnover_id)
  execute function interview_log_turnover_assignment();

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
  if new.status is distinct from old.status and new.status = 'Terpilih' then
    perform create_notification(
      'turnover',
      'Turnover terisi',
      coalesce(new.jabatan, '-') || ' — ' || coalesce(new.nama_karyawan_baru, new.nama_karyawan_existing, '-') || ' (' || coalesce(new.nomor_turnover, '-') || ')',
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

create or replace function mark_all_notifications_read() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into notification_reads (notification_id, user_id)
  select n.id, auth.uid() from notifications n
  on conflict (notification_id, user_id) do nothing;
end;
$$;

alter table users enable row level security;
alter table ers_document enable row level security;
alter table turnover enable row level security;
alter table interview_harian enable row level security;
alter table interview_candidates enable row level security;
alter table interview_candidate_history enable row level security;
alter table id_card_process enable row level security;
alter table notifications enable row level security;
alter table notification_reads enable row level security;

create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid();
$$;

create policy users_self_read on users for select using (
  id = auth.uid() or auth_role() = 'Super_Admin'
);

create policy ers_select on ers_document for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment') or (auth_role() = 'OPS' and uploaded_by = auth.uid())
);
create policy ers_insert on ers_document for insert with check (
  auth_role() in ('OPS', 'Super_Admin')
);
create policy ers_update on ers_document for update using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);

create policy turnover_select on turnover for select using (
  auth_role() in ('Super_Admin', 'HR_ER', 'HR_Recruitment', 'HR_Training', 'HR_Payroll') or
  (auth_role() = 'OPS' and created_by = auth.uid())
);
create policy turnover_insert on turnover for insert with check (
  auth_role() in ('OPS', 'Super_Admin')
);
create policy turnover_update on turnover for update using (
  auth_role() in ('Super_Admin', 'HR_ER') or
  (auth_role() = 'OPS' and created_by = auth.uid())
);

create policy interview_select on interview_harian for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment', 'HR_ER', 'HR_Payroll')
);
create policy interview_insert on interview_harian for insert with check (
  auth_role() in ('HR_Recruitment', 'Super_Admin')
);
create policy interview_update on interview_harian for update using (
  auth_role() in ('HR_Recruitment', 'Super_Admin')
);

create policy interview_candidates_select on interview_candidates for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);
create policy interview_candidate_history_select on interview_candidate_history for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);

alter table interview_turnover_log enable row level security;
create policy interview_turnover_log_select on interview_turnover_log for select using (
  auth_role() in ('Super_Admin', 'HR_Recruitment')
);

create policy idcard_select on id_card_process for select using (
  auth_role() in ('Super_Admin', 'HR_Training', 'HR_Recruitment')
);
create policy idcard_insert on id_card_process for insert with check (
  auth_role() in ('HR_Training', 'HR_Recruitment', 'Super_Admin')
);
create policy idcard_update on id_card_process for update using (
  auth_role() in ('HR_Training', 'Super_Admin')
);

create policy notifications_select on notifications for select using (auth.uid() is not null);

create policy notification_reads_select on notification_reads for select using (user_id = auth.uid());
create policy notification_reads_insert on notification_reads for insert with check (user_id = auth.uid());

create or replace view my_notifications as
select n.*, (nr.user_id is not null) as is_read
from notifications n
left join notification_reads nr on nr.notification_id = n.id and nr.user_id = auth.uid()
order by n.created_at desc;

grant select on my_notifications to authenticated;

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

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  users, ers_document, turnover, interview_harian, interview_candidates, interview_candidate_history,
  interview_turnover_log, id_card_process, notifications, notification_reads
  to authenticated;
grant execute on function mark_all_notifications_read() to authenticated;

do $$
begin
  execute 'alter publication supabase_realtime add table notifications';
exception when others then
  null;
end $$;