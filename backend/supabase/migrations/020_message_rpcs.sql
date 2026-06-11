-- Bypasses RLS for all message operations (service role client doesn't set auth.uid())

create or replace function get_messages_for_match(p_match_id uuid)
returns setof public.messages
security definer
language sql
as $$
  select * from public.messages
  where match_id = p_match_id
  order by sent_at;
$$;

create or replace function insert_message(p_match_id uuid, p_sender_id uuid, p_content text)
returns setof public.messages
security definer
language sql
as $$
  insert into public.messages (match_id, sender_id, content)
  values (p_match_id, p_sender_id, p_content)
  returning *;
$$;
