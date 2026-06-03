-- Returns recent activity for a user:
-- new matches, idea interests on their ideas, and unread messages
create or replace function get_user_notifications(p_user_id uuid)
returns table (
  id          uuid,
  type        text,
  actor_name  text,
  actor_avatar text,
  body        text,
  match_id    uuid,
  created_at  timestamptz
)
security definer
language sql
as $$
  select * from (
  -- New matches
  select
    m.id,
    'match'::text,
    p.name,
    p.avatar_url,
    'You matched with ' || p.name,
    m.id,
    m.matched_at as created_at
  from public.matches m
  join public.profiles p on p.id = case
    when m.user1_id = p_user_id then m.user2_id
    else m.user1_id
  end
  where m.user1_id = p_user_id or m.user2_id = p_user_id

  union all

  -- Idea interests on your ideas
  select
    ii.id,
    'interest'::text,
    p.name,
    p.avatar_url,
    p.name || ' is interested in "' || si.name || '"',
    null::uuid,
    ii.created_at as created_at
  from public.idea_interests ii
  join public.startup_ideas si on si.id = ii.idea_id
  join public.profiles p on p.id = ii.user_id
  where si.founder_id = p_user_id

  union all

  -- Unread messages sent to you
  select
    msg.id,
    'message'::text,
    p.name,
    p.avatar_url,
    p.name || ': ' || left(msg.content, 80),
    msg.match_id,
    msg.sent_at as created_at
  from public.messages msg
  join public.profiles p on p.id = msg.sender_id
  join public.matches mt on mt.id = msg.match_id
  where msg.sender_id != p_user_id
    and msg.read_at is null
    and (mt.user1_id = p_user_id or mt.user2_id = p_user_id)

  ) sub
  order by created_at desc
  limit 60;
$$;
