-- Bypasses RLS for match membership checks (service role client doesn't set auth.uid())
create or replace function get_match_members(p_match_id uuid)
returns table(user1_id uuid, user2_id uuid)
security definer
language sql
as $$
  select user1_id, user2_id
  from public.matches
  where id = p_match_id;
$$;
