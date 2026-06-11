-- Bypasses RLS for idea write operations (service role client doesn't set auth.uid())

create or replace function delete_startup_idea(p_idea_id uuid, p_founder_id uuid)
returns void
security definer
language sql
as $$
  delete from public.startup_ideas
  where id = p_idea_id and founder_id = p_founder_id;
$$;

create or replace function update_startup_idea(
  p_idea_id     uuid,
  p_founder_id  uuid,
  p_name        text,
  p_description text,
  p_category    text,
  p_stage       text,
  p_looking_for text[]
)
returns void
security definer
language sql
as $$
  update public.startup_ideas
  set name = p_name,
      description = p_description,
      category = p_category,
      stage = p_stage,
      looking_for = p_looking_for
  where id = p_idea_id and founder_id = p_founder_id;
$$;

create or replace function insert_idea_interest(p_user_id uuid, p_idea_id uuid)
returns void
security definer
language sql
as $$
  insert into public.idea_interests (user_id, idea_id)
  values (p_user_id, p_idea_id)
  on conflict do nothing;
$$;
