alter table public.profiles
  add column if not exists is_discoverable boolean not null default true;
