-- Atomic swipe + match creation. Re-run this in Supabase SQL Editor to update.
create or replace function process_swipe(
  p_swiper_id uuid,
  p_swiped_id uuid,
  p_direction text
)
returns jsonb
security definer
language plpgsql
as $$
declare
  v_mutual        boolean;
  v_match_id      uuid;
  v_existing_id   uuid;
begin
  insert into public.swipes (swiper_id, swiped_id, direction)
  values (p_swiper_id, p_swiped_id, p_direction)
  on conflict (swiper_id, swiped_id) do update set direction = excluded.direction;

  if p_direction != 'right' then
    return jsonb_build_object('matched', false, 'is_new', false);
  end if;

  select exists(
    select 1 from public.swipes
    where swiper_id = p_swiped_id
      and swiped_id = p_swiper_id
      and direction = 'right'
  ) into v_mutual;

  if not v_mutual then
    return jsonb_build_object('matched', false, 'is_new', false);
  end if;

  select id into v_existing_id
  from public.matches
  where (user1_id = p_swiper_id and user2_id = p_swiped_id)
     or (user1_id = p_swiped_id and user2_id = p_swiper_id)
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object('matched', true, 'is_new', false, 'match', jsonb_build_object('id', v_existing_id));
  end if;

  insert into public.matches (user1_id, user2_id)
  values (p_swiper_id, p_swiped_id)
  returning id into v_match_id;

  return jsonb_build_object('matched', true, 'is_new', true, 'match', jsonb_build_object('id', v_match_id));
end;
$$;
