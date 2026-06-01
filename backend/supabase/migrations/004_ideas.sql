-- Idea interests: tracks who swiped right on which idea
create table if not exists public.idea_interests (
    id         uuid        primary key default gen_random_uuid(),
    user_id    uuid        not null references public.profiles(id) on delete cascade,
    idea_id    uuid        not null references public.startup_ideas(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, idea_id)
);

alter table public.idea_interests enable row level security;

create policy "interests_select_own" on public.idea_interests for select using (auth.uid() = user_id);
create policy "interests_insert_own" on public.idea_interests for insert with check (auth.uid() = user_id);
