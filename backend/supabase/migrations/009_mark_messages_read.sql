create or replace function mark_messages_read(p_match_id uuid, p_reader_id uuid)
returns void
security definer
language sql
as $$
  update public.messages
  set read_at = now()
  where match_id = p_match_id
    and sender_id != p_reader_id;
$$;
