-- =========================================================================
-- PATCH: fixes "new row violates row-level security policy for table
-- notifications" (and two related silent bugs) WITHOUT touching any
-- existing data — unlike the main schema.sql, this file does not drop or
-- recreate any table. Safe to run anytime on a project that's already
-- live with real users/accounts in it.
--
-- Root cause: every trigger function below defaulted to SECURITY INVOKER
-- (Postgres's default), meaning it ran with the CALLING user's own RLS
-- visibility instead of bypassing it. That broke two ways:
--   1. `notifications` has no INSERT policy for `authenticated` — so any
--      trigger inserting a notification failed with 42501. This hit ALL
--      of: ERS create, Turnover accept/reject, Interview create,
--      candidate Hired, ID Card Completed — not just ERS.
--   2. The ERS/Turnover auto-numbering triggers do `select count(*)` on
--      their own table, but OPS's SELECT policy only shows rows THEY
--      created — undercounting the true sequence and risking a duplicate
--      nomor_ers/nomor_turnover (a UNIQUE constraint error) once a second
--      OPS account starts submitting.
--
-- This is already folded into the master supabase/schema.sql for any
-- future fresh install — this file exists only so you don't have to
-- re-run (and reset) the whole database just to pick up the fix.
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

create or replace function turnover_set_nomor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.nomor_turnover is null then
    new.nomor_turnover := next_doc_number('TO', 'turnover', 'nomor_turnover');
  end if;
  return new;
end;
$$;

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

create or replace function set_updated_at() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

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

-- Nothing to do for triggers themselves or `turnover_sync_karyawan_baru` /
-- `mark_all_notifications_read` / `auth_role` — those three already had
-- SECURITY DEFINER set correctly from the start.
