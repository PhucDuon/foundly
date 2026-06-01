-- Re-run this in Supabase SQL Editor to update the function (adds avatar_url)
create or replace function get_likes(p_user_id uuid)
returns table (
  id               uuid,
  name             text,
  emoji            text,
  role             text,
  bio              text,
  location         text,
  skills           text[],
  interests        text[],
  experience_level text,
  avatar_url       text,
  created_at       timestamptz
)
security definer
language sql
as $$
  select
    p.id, p.name, p.emoji, p.role, p.bio,
    p.location, p.skills, p.interests, p.experience_level, p.avatar_url, p.created_at
  from public.swipes s
  join public.profiles p on p.id = s.swiper_id
  where s.swiped_id  = p_user_id
    and s.direction  = 'right'
    and not exists (
      select 1 from public.swipes s2
      where s2.swiper_id = p_user_id
        and s2.swiped_id = s.swiper_id
    );
$$;
