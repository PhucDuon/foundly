-- People the current user swiped right on who haven't matched back yet
create or replace function get_my_likes(p_user_id uuid)
returns table (
  id                uuid,
  name              text,
  emoji             text,
  role              text,
  bio               text,
  avatar_url        text,
  linkedin_verified boolean
)
security definer
language sql
as $$
  select
    p.id, p.name, p.emoji, p.role, p.bio, p.avatar_url, p.linkedin_verified
  from public.swipes s
  join public.profiles p on p.id = s.swiped_id
  where s.swiper_id = p_user_id
    and s.direction = 'right'
    and not exists (
      select 1 from public.matches m
      where (m.user1_id = p_user_id and m.user2_id = s.swiped_id)
         or (m.user1_id = s.swiped_id and m.user2_id = p_user_id)
    )
  order by s.created_at desc;
$$;
