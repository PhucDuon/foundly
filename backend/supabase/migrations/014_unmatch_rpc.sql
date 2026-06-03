-- Atomically deletes all match records between two users and clears their swipes.
-- Avoids supabase-py chained .eq() filter bugs.
create or replace function unmatch_users(p_match_id uuid, p_user_id uuid)
returns void
security definer
language plpgsql
as $$
declare
  v_user1 uuid;
  v_user2 uuid;
begin
  select user1_id, user2_id into v_user1, v_user2
  from public.matches
  where id = p_match_id
    and (user1_id = p_user_id or user2_id = p_user_id);

  if not found then
    raise exception 'Match not found or not authorized';
  end if;

  delete from public.matches
  where (user1_id = v_user1 and user2_id = v_user2)
     or (user1_id = v_user2 and user2_id = v_user1);

  delete from public.swipes
  where (swiper_id = v_user1 and swiped_id = v_user2)
     or (swiper_id = v_user2 and swiped_id = v_user1);
end;
$$;
