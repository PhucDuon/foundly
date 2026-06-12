alter table public.profiles
  add column if not exists linkedin_verified boolean default false;
