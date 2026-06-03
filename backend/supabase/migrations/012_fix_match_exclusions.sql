-- Fix: idea matches create a row in `matches` but not in `swipes`.
-- Both functions below need to also check `matches` so idea-matched users
-- are excluded from discover and from the "who liked you" list.

-- 1. Discover exclusions: also exclude users already matched via ideas
create or replace function get_excluded_user_ids(p_user_id uuid)
returns setof uuid
security definer
language sql
as $$
  select swiped_id  from public.swipes where swiper_id  = p_user_id
  union
  select blocked_id from public.blocks where blocker_id = p_user_id
  union
  select blocker_id from public.blocks where blocked_id = p_user_id
  union
  -- idea matches don't write to swipes, so also exclude via matches table
  select user2_id   from public.matches where user1_id  = p_user_id
  union
  select user1_id   from public.matches where user2_id  = p_user_id
  union
  select p_user_id;
$$;

-- 2. Who-liked-you: hide likers you are already matched with (idea match counts)
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
  where s.swiped_id = p_user_id
    and s.direction = 'right'
    -- not yet swiped back
    and not exists (
      select 1 from public.swipes s2
      where s2.swiper_id = p_user_id
        and s2.swiped_id = s.swiper_id
    )
    -- not already matched via ideas (which bypass swipes)
    and not exists (
      select 1 from public.matches m
      where (m.user1_id = p_user_id and m.user2_id = s.swiper_id)
         or (m.user1_id = s.swiper_id and m.user2_id = p_user_id)
    );
$$;
