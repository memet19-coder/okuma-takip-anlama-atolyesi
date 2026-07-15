create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  device_id uuid unique not null,
  sync_token_hash text not null,
  student_name text not null check (char_length(student_name) between 1 and 80),
  grade smallint check (grade between 5 and 8),
  reading_history jsonb not null default '[]'::jsonb,
  comprehension_history jsonb not null default '[]'::jsonb,
  read_count integer not null default 0 check (read_count >= 0),
  word_count integer not null default 0 check (word_count >= 0),
  reading_minutes integer not null default 0 check (reading_minutes >= 0),
  last_text text,
  active_days integer not null default 0 check (active_days >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.student_progress enable row level security;
revoke all on table public.student_progress from anon, authenticated;

create table if not exists private.teacher_settings (
  singleton boolean primary key default true check (singleton),
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

alter table private.teacher_settings enable row level security;
revoke all on table private.teacher_settings from public, anon, authenticated;

create or replace function public.sync_student_progress(
  p_device_id uuid,
  p_sync_token text,
  p_student_name text,
  p_grade smallint,
  p_reading_history jsonb,
  p_comprehension_history jsonb,
  p_read_count integer,
  p_word_count integer,
  p_reading_minutes integer,
  p_last_text text,
  p_active_days integer
)
returns void
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  token_hash text := encode(digest(p_sync_token, 'sha256'), 'hex');
begin
  if char_length(p_sync_token) < 32 then
    raise exception 'SYNC_TOKEN_INVALID';
  end if;

  insert into public.student_progress (
    device_id, sync_token_hash, student_name, grade, reading_history,
    comprehension_history, read_count, word_count, reading_minutes,
    last_text, active_days, updated_at
  ) values (
    p_device_id, token_hash, trim(p_student_name), p_grade,
    coalesce(p_reading_history, '[]'::jsonb),
    coalesce(p_comprehension_history, '[]'::jsonb),
    greatest(coalesce(p_read_count, 0), 0),
    greatest(coalesce(p_word_count, 0), 0),
    greatest(coalesce(p_reading_minutes, 0), 0),
    p_last_text,
    greatest(coalesce(p_active_days, 0), 0),
    now()
  )
  on conflict (device_id) do update set
    student_name = excluded.student_name,
    grade = excluded.grade,
    reading_history = excluded.reading_history,
    comprehension_history = excluded.comprehension_history,
    read_count = excluded.read_count,
    word_count = excluded.word_count,
    reading_minutes = excluded.reading_minutes,
    last_text = excluded.last_text,
    active_days = excluded.active_days,
    updated_at = now()
  where public.student_progress.sync_token_hash = token_hash;

  if not found then
    raise exception 'SYNC_TOKEN_INVALID';
  end if;
end;
$$;

revoke all on function public.sync_student_progress(uuid, text, text, smallint, jsonb, jsonb, integer, integer, integer, text, integer) from public;
grant execute on function public.sync_student_progress(uuid, text, text, smallint, jsonb, jsonb, integer, integer, integer, text, integer) to anon, authenticated;

create or replace function public.configure_teacher_pin(new_pin text)
returns void
language plpgsql
security definer
set search_path = private, extensions
as $$
begin
  if char_length(new_pin) < 6 then
    raise exception 'PIN en az 6 karakter olmalıdır.';
  end if;

  insert into private.teacher_settings (singleton, pin_hash, updated_at)
  values (true, encode(digest(new_pin, 'sha256'), 'hex'), now())
  on conflict (singleton) do update set
    pin_hash = excluded.pin_hash,
    updated_at = now();
end;
$$;

revoke all on function public.configure_teacher_pin(text) from public, anon, authenticated;
grant execute on function public.configure_teacher_pin(text) to service_role;

create or replace function public.teacher_reading_report(access_pin text)
returns table (
  student_id uuid,
  student_name text,
  grade smallint,
  read_count integer,
  word_count integer,
  reading_minutes integer,
  last_text text,
  active_days integer,
  reading_history jsonb,
  comprehension_history jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  expected_hash text;
begin
  select pin_hash into expected_hash
  from private.teacher_settings
  where singleton = true;

  if expected_hash is null then
    raise exception 'TEACHER_PIN_NOT_CONFIGURED';
  end if;
  if encode(digest(access_pin, 'sha256'), 'hex') <> expected_hash then
    raise exception 'TEACHER_PIN_INVALID';
  end if;

  return query
  select
    progress.id,
    progress.student_name,
    progress.grade,
    progress.read_count,
    progress.word_count,
    progress.reading_minutes,
    progress.last_text,
    progress.active_days,
    progress.reading_history,
    progress.comprehension_history,
    progress.updated_at
  from public.student_progress progress
  order by progress.student_name, progress.updated_at desc;
end;
$$;

revoke all on function public.teacher_reading_report(text) from public;
grant execute on function public.teacher_reading_report(text) to anon, authenticated;
