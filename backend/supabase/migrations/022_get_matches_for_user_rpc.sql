-- Bypasses RLS for the full matches list query (service role client doesn't set auth.uid())
create or replace function get_matches_for_user(p_user_id uuid)
returns table(
    id              uuid,
    user1_id        uuid,
    user2_id        uuid,
    matched_at      timestamptz,
    last_message_at timestamptz,
    has_unread      boolean,
    user1           json,
    user2           json
)
security definer
language sql
as $$
    select
        m.id,
        m.user1_id,
        m.user2_id,
        m.matched_at,
        coalesce(
            (select msg.sent_at from public.messages msg
             where msg.match_id = m.id
             order by msg.sent_at desc limit 1),
            m.matched_at
        ) as last_message_at,
        exists(
            select 1 from public.messages msg
            where msg.match_id = m.id
              and msg.sender_id != p_user_id
              and msg.read_at is null
        ) as has_unread,
        (select row_to_json(p) from public.profiles p where p.id = m.user1_id) as user1,
        (select row_to_json(p) from public.profiles p where p.id = m.user2_id) as user2
    from public.matches m
    where m.user1_id = p_user_id or m.user2_id = p_user_id
    order by last_message_at desc nulls last;
$$;
