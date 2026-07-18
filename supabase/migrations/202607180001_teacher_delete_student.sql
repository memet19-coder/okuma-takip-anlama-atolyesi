create or replace function public.teacher_delete_student(
  access_pin text,
  target_student_id uuid
)
returns void
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

  delete from public.student_progress
  where id = target_student_id;

  if not found then
    raise exception 'STUDENT_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.teacher_delete_student(text, uuid) from public;
grant execute on function public.teacher_delete_student(text, uuid) to anon, authenticated;
