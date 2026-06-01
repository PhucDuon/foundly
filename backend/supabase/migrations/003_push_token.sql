-- Add push_token column to profiles
alter table public.profiles
  add column if not exists push_token text default null;
