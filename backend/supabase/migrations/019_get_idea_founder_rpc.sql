-- Bypasses RLS for idea ownership checks (service role client doesn't set auth.uid())
create or replace function get_idea_founder(p_idea_id uuid)
returns uuid
security definer
language sql
as $$
  select founder_id
  from public.startup_ideas
  where id = p_idea_id;
$$;

-- Returns idea + founder profile for express_interest endpoint
create or replace function get_idea_with_founder(p_idea_id uuid)
returns table(
  idea_id      uuid,
  idea_name    text,
  founder_id   uuid,
  founder_name text,
  founder_emoji text,
  founder_role text,
  push_token   text
)
security definer
language sql
as $$
  select
    i.id,
    i.name,
    i.founder_id,
    p.name,
    p.emoji,
    p.role,
    p.push_token
  from public.startup_ideas i
  join public.profiles p on p.id = i.founder_id
  where i.id = p_idea_id;
$$;
