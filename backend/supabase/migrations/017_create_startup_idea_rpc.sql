-- Bypasses RLS for idea creation (service role client doesn't set auth.uid())
create or replace function create_startup_idea(
  p_founder_id  uuid,
  p_name        text,
  p_description text,
  p_category    text,
  p_stage       text,
  p_looking_for text[]
)
returns uuid
security definer
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.startup_ideas (founder_id, name, description, category, stage, looking_for)
  values (p_founder_id, p_name, p_description, p_category, p_stage, p_looking_for)
  returning id into v_id;
  return v_id;
end;
$$;
