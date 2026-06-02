-- Returns all user IDs that should be excluded from discover
-- (already swiped, blocked, or self)
create or replace function get_excluded_user_ids(p_user_id uuid)
returns setof uuid
security definer
language sql
as $$
  select swiped_id   from public.swipes  where swiper_id  = p_user_id
  union
  select blocked_id  from public.blocks  where blocker_id = p_user_id
  union
  select blocker_id  from public.blocks  where blocked_id = p_user_id
  union
  select p_user_id;
$$;
