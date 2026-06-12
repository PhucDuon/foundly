create or replace function set_linkedin_verified(p_user_id uuid)
returns void
security definer
language sql
as $$
  update public.profiles
  set linkedin_verified = true
  where id = p_user_id;
$$;
