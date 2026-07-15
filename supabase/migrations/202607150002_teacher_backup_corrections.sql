alter table public.student_progress
add column if not exists teacher_revision integer not null default 0;

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
  stored_hash text;
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
  where public.student_progress.sync_token_hash = token_hash
    and public.student_progress.teacher_revision = 0;

  if not found then
    select sync_token_hash into stored_hash
    from public.student_progress
    where device_id = p_device_id;

    if stored_hash is distinct from token_hash then
      raise exception 'SYNC_TOKEN_INVALID';
    end if;
  end if;
end;
$$;

create or replace function public.sync_student_progress_v2(
  p_device_id uuid,
  p_sync_token text,
  p_teacher_revision integer,
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
  stored_hash text;
begin
  if char_length(p_sync_token) < 32 then
    raise exception 'SYNC_TOKEN_INVALID';
  end if;

  insert into public.student_progress (
    device_id, sync_token_hash, student_name, grade, reading_history,
    comprehension_history, read_count, word_count, reading_minutes,
    last_text, active_days, teacher_revision, updated_at
  ) values (
    p_device_id, token_hash, trim(p_student_name), p_grade,
    coalesce(p_reading_history, '[]'::jsonb),
    coalesce(p_comprehension_history, '[]'::jsonb),
    greatest(coalesce(p_read_count, 0), 0),
    greatest(coalesce(p_word_count, 0), 0),
    greatest(coalesce(p_reading_minutes, 0), 0),
    p_last_text,
    greatest(coalesce(p_active_days, 0), 0),
    greatest(coalesce(p_teacher_revision, 0), 0),
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
  where public.student_progress.sync_token_hash = token_hash
    and public.student_progress.teacher_revision <= greatest(coalesce(p_teacher_revision, 0), 0);

  if not found then
    select sync_token_hash into stored_hash
    from public.student_progress
    where device_id = p_device_id;

    if stored_hash is distinct from token_hash then
      raise exception 'SYNC_TOKEN_INVALID';
    end if;
  end if;
end;
$$;

revoke all on function public.sync_student_progress_v2(uuid, text, integer, text, smallint, jsonb, jsonb, integer, integer, integer, text, integer) from public;
grant execute on function public.sync_student_progress_v2(uuid, text, integer, text, smallint, jsonb, jsonb, integer, integer, integer, text, integer) to anon, authenticated;

create or replace function public.get_student_correction(
  p_device_id uuid,
  p_sync_token text,
  p_known_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  token_hash text := encode(digest(p_sync_token, 'sha256'), 'hex');
  progress public.student_progress%rowtype;
begin
  if char_length(p_sync_token) < 32 then
    raise exception 'SYNC_TOKEN_INVALID';
  end if;

  select * into progress
  from public.student_progress
  where device_id = p_device_id;

  if not found then
    return null;
  end if;
  if progress.sync_token_hash <> token_hash then
    raise exception 'SYNC_TOKEN_INVALID';
  end if;
  if progress.teacher_revision <= greatest(coalesce(p_known_revision, 0), 0) then
    return null;
  end if;

  return jsonb_build_object(
    'student_name', progress.student_name,
    'grade', progress.grade,
    'reading_history', progress.reading_history,
    'comprehension_history', progress.comprehension_history,
    'teacher_revision', progress.teacher_revision
  );
end;
$$;

revoke all on function public.get_student_correction(uuid, text, integer) from public;
grant execute on function public.get_student_correction(uuid, text, integer) to anon, authenticated;

create or replace function public.teacher_update_student(
  access_pin text,
  target_student_id uuid,
  new_name text,
  new_grade smallint,
  new_reading_history jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  expected_hash text;
  clean_history jsonb := coalesce(new_reading_history, '[]'::jsonb);
  next_read_count integer;
  next_word_count integer;
  next_reading_minutes integer;
  next_last_text text;
  next_active_days integer;
  next_revision integer;
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
  if char_length(trim(new_name)) not between 1 and 80 then
    raise exception 'STUDENT_NAME_INVALID';
  end if;
  if new_grade not between 5 and 8 then
    raise exception 'STUDENT_GRADE_INVALID';
  end if;
  if jsonb_typeof(clean_history) <> 'array' then
    raise exception 'READING_HISTORY_INVALID';
  end if;

  next_read_count := jsonb_array_length(clean_history);

  select
    coalesce(sum(case when item->>'wordCount' ~ '^\d+$' then (item->>'wordCount')::integer else 0 end), 0),
    coalesce(sum(case when item->>'readingMinutes' ~ '^\d+$' then (item->>'readingMinutes')::integer else 0 end), 0),
    count(distinct nullif(item->>'date', ''))
  into next_word_count, next_reading_minutes, next_active_days
  from jsonb_array_elements(clean_history) item;

  if next_read_count > 0 then
    next_last_text := clean_history -> (next_read_count - 1) ->> 'title';
  end if;

  update public.student_progress
  set student_name = trim(new_name),
      grade = new_grade,
      reading_history = clean_history,
      read_count = next_read_count,
      word_count = next_word_count,
      reading_minutes = next_reading_minutes,
      last_text = next_last_text,
      active_days = next_active_days,
      teacher_revision = teacher_revision + 1,
      updated_at = now()
  where id = target_student_id
  returning teacher_revision into next_revision;

  if not found then
    raise exception 'STUDENT_NOT_FOUND';
  end if;
  return next_revision;
end;
$$;

revoke all on function public.teacher_update_student(text, uuid, text, smallint, jsonb) from public;
grant execute on function public.teacher_update_student(text, uuid, text, smallint, jsonb) to anon, authenticated;
