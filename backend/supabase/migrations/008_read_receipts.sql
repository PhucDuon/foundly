alter table public.messages
  add column if not exists read_at timestamptz default null;
